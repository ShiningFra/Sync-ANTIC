package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.entity.ActivityLog.ActionType;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Règles de visibilité et d'action sur les dossiers.
 *
 * Visibilité :
 *   super_admin    → tout voit (héritage total)
 *   directeur      → tout voit (héritage total)
 *   admin_cirt     → tout sauf SECRET_PRIVE d'autrui
 *   chef_service / agent_cirt → dossiers synchronisés de leurs catégories autorisées
 *   directeur_antenne → tous les dossiers de son antenne sauf SECRET_PRIVE d'autrui
 *   agent_antenne  → ses propres dossiers + ANTENNE_PUBLIC/PUBLIC de son antenne (si catégorie ok)
 *
 * Workflow dossier :
 *   1. agent_antenne crée le dossier (statut EN_ATTENTE, non synchronisé)
 *   2. agent_antenne demande la sync → directeur_antenne approuve/rejette
 *   3. Après approbation : dossier visible par CIRT, statut EN_ATTENTE côté CIRT
 *   4. CIRT ouvre le dossier (EN_COURS)
 *   5. CIRT valide (VALIDE)
 *   6. directeur ou super_admin apposer le tampon
 *   7. directeur ou super_admin apposer le sceau final
 *   8. Archivage
 *
 * Niveaux de sécurité :
 *   SECRET_PRIVE   → seul le créateur voit. Pas de sync possible.
 *   ANTENNE_PRIVE  → directeur_antenne + CIRT
 *   ANTENNE_PUBLIC → tous agents antenne avec la catégorie
 *   CIRT_ONLY      → CIRT uniquement
 *   PUBLIC         → tous avec la catégorie (défaut)
 *
 * Édition du niveau de sécurité :
 *   - Agents simples (agent_antenne, agent_cirt) : JAMAIS
 *   - Hiérarchie : si un supérieur a configuré, un subordonné ne peut pas écraser
 *   - Super_admin > directeur > admin_cirt > directeur_antenne > chef_service
 */
@Service
public class DossierService {

    @Autowired private DossierRepository           dossierRepo;
    @Autowired private CategoryRepository          categoryRepo;
    @Autowired private ServiceCirtRepository       serviceCirtRepo;
    @Autowired private PermissionCategoryRepository permRepo;
    @Autowired private AntenneCategoryRepository   antenneCatRepo;
    @Autowired private DossierSyncRequestRepository syncRequestRepo;
    @Autowired private ActivityLogService          activityLogService;

    // ── Lecture ────────────────────────────────────────────────────────────

    public List<Dossier> getDossiers() {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        // super_admin et directeur → tout voir sans restriction
        if (u.isTopLevel()) {
            return dossierRepo.findAll();
        }

        // admin_cirt → tout sauf SECRET_PRIVE d'autrui
        if (u.isAdminCirt()) {
            return dossierRepo.findAll().stream()
                .filter(d -> d.getSecurityLevel() != SecurityLevel.SECRET_PRIVE || isCreator(d, u))
                .collect(Collectors.toList());
        }

        // chef_service / agent_cirt → dossiers synchronisés + catégories autorisées
        if (u.isChefService() || u.isAgentCirt()) {
            if (u.getService() == null) return List.of();
            List<Long> allowedCatIds = permRepo.findByUserId(u.getId())
                .stream().map(p -> p.getCategory().getId()).collect(Collectors.toList());
            return dossierRepo.findAll().stream()
                .filter(Dossier::isSyncedToCirt)
                .filter(d -> d.getSecurityLevel() != SecurityLevel.SECRET_PRIVE)
                .filter(d -> d.getSecurityLevel() != SecurityLevel.ANTENNE_PRIVE
                          || u.isChefService()) // chef_service voit ANTENNE_PRIVE
                .filter(d -> allowedCatIds.isEmpty()
                          || allowedCatIds.contains(d.getCategory() != null ? d.getCategory().getId() : -1L))
                .collect(Collectors.toList());
        }

        // directeur_antenne → tous les dossiers de son antenne sauf SECRET_PRIVE d'autrui
        if (u.isDirecteurAntenne() && u.getAntenne() != null) {
            return dossierRepo.findByAntenneId(u.getAntenne().getId()).stream()
                .filter(d -> d.getSecurityLevel() != SecurityLevel.SECRET_PRIVE || isCreator(d, u))
                .collect(Collectors.toList());
        }

        // agent_antenne → ses propres dossiers + ANTENNE_PUBLIC/PUBLIC de son antenne (avec catégorie)
        if (u.isAgentAntenne() && u.getAntenne() != null) {
            List<Long> myCatIds = permRepo.findByUserId(u.getId())
                .stream().map(p -> p.getCategory().getId()).collect(Collectors.toList());
            return dossierRepo.findByAntenneId(u.getAntenne().getId()).stream()
                .filter(d -> {
                    if (isCreator(d, u)) return true;
                    SecurityLevel sl = d.getSecurityLevel();
                    if (sl == SecurityLevel.SECRET_PRIVE
                     || sl == SecurityLevel.ANTENNE_PRIVE
                     || sl == SecurityLevel.CIRT_ONLY) return false;
                    Long catId = d.getCategory() != null ? d.getCategory().getId() : -1L;
                    return myCatIds.contains(catId);
                })
                .collect(Collectors.toList());
        }

        return List.of();
    }

    public Dossier getDossierById(Long id) {
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable : " + id));
        checkReadAccess(d);
        return d;
    }

    // ── Création ───────────────────────────────────────────────────────────

    @Transactional
    public Dossier createDossier(DossierCreateRequest req) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        if (!u.isAgentAntenne()) {
            throw new RuntimeException("Seuls les agents des antennes peuvent créer des dossiers");
        }

        Category cat = categoryRepo.findById(req.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        // Catégorie affiliée à l'antenne de l'agent ?
        if (u.getAntenne() != null
                && !antenneCatRepo.existsByAntenneIdAndCategoryId(u.getAntenne().getId(), cat.getId())) {
            throw new RuntimeException("Cette catégorie n'est pas disponible pour votre antenne");
        }

        // Permission individuelle sur la catégorie
        if (!permRepo.existsByUserIdAndCategoryId(u.getId(), cat.getId())) {
            throw new RuntimeException("Vous n'avez pas accès à cette catégorie");
        }

        // Niveau de sécurité : celui demandé par l'agent ou celui de la catégorie
        SecurityLevel sl = req.getSecurityLevel() != null ? req.getSecurityLevel() : cat.getSecurityLevel();

        Dossier d = new Dossier();
        d.setTitle(req.getTitle());
        d.setDescription(req.getDescription());
        d.setCategory(cat);
        d.setAntenne(u.getAntenne());
        d.setCreatedBy(u);
        d.setStatus(Status.EN_ATTENTE);
        d.setCreatedAt(LocalDateTime.now());
        d.setSecurityLevel(sl);
        d.setSecuritySetBy(u);
        d.setSyncedToCirt(false); // jamais synchronisé à la création

        Dossier saved = dossierRepo.save(d);
        activityLogService.log(u, ActionType.DOSSIER_CREATED,
            "Dossier", saved.getId(), saved.getTitle(),
            "Création du dossier '" + saved.getTitle() + "' (catégorie: " + cat.getName()
                + ", sécurité: " + sl + ")");
        return saved;
    }

    // ── Demande de synchronisation au CIRT ────────────────────────────────

    @Transactional
    public DossierSyncRequest requestSync(Long dossierId) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        Dossier d = dossierRepo.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        if (!isCreator(d, u)) {
            throw new RuntimeException("Seul le créateur peut demander la synchronisation");
        }
        if (d.getSecurityLevel() == SecurityLevel.SECRET_PRIVE) {
            throw new RuntimeException("Un dossier secret privé ne peut pas être synchronisé au CIRT");
        }
        if (d.isSyncedToCirt()) {
            throw new RuntimeException("Ce dossier est déjà synchronisé");
        }
        if (syncRequestRepo.existsByDossierIdAndStatus(dossierId, DossierSyncRequest.SyncStatus.PENDING)) {
            throw new RuntimeException("Une demande de synchronisation est déjà en attente");
        }

        DossierSyncRequest req = new DossierSyncRequest();
        req.setDossier(d);
        req.setRequestedBy(u);
        req.setStatus(DossierSyncRequest.SyncStatus.PENDING);
        DossierSyncRequest saved = syncRequestRepo.save(req);

        activityLogService.log(u, ActionType.DOSSIER_SYNC_REQUESTED,
            "Dossier", d.getId(), d.getTitle(),
            "Demande de synchronisation au CIRT pour le dossier '" + d.getTitle() + "'");
        return saved;
    }

    /** Directeur_antenne (ou supérieur) approuve ou rejette une demande de sync */
    @Transactional
    public DossierSyncRequest reviewSync(Long syncRequestId, boolean approved, String motif) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        if (!u.isDirecteurAntenne() && !u.isTopLevel() && !u.isAdminCirt()) {
            throw new RuntimeException("Seul le directeur d'antenne peut traiter les demandes de synchronisation");
        }

        DossierSyncRequest req = syncRequestRepo.findById(syncRequestId)
            .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        if (req.getStatus() != DossierSyncRequest.SyncStatus.PENDING) {
            throw new RuntimeException("Cette demande a déjà été traitée");
        }

        // Le directeur_antenne ne peut traiter que les dossiers de son antenne
        if (u.isDirecteurAntenne()) {
            Dossier d = req.getDossier();
            if (d.getAntenne() == null || !d.getAntenne().getId().equals(
                    u.getAntenne() != null ? u.getAntenne().getId() : null)) {
                throw new RuntimeException("Ce dossier n'appartient pas à votre antenne");
            }
        }

        req.setReviewedBy(u);
        req.setReviewedAt(LocalDateTime.now());
        req.setMotif(motif);

        if (approved) {
            req.setStatus(DossierSyncRequest.SyncStatus.APPROVED);
            Dossier d = req.getDossier();
            d.setSyncedToCirt(true);
            dossierRepo.save(d);
            activityLogService.log(u, ActionType.DOSSIER_SYNC_APPROVED,
                "Dossier", d.getId(), d.getTitle(),
                "Synchronisation approuvée pour le dossier '" + d.getTitle() + "'");
        } else {
            req.setStatus(DossierSyncRequest.SyncStatus.REJECTED);
            activityLogService.log(u, ActionType.DOSSIER_SYNC_REJECTED,
                "Dossier", req.getDossier().getId(), req.getDossier().getTitle(),
                "Synchronisation rejetée pour le dossier '" + req.getDossier().getTitle()
                    + "' — motif: " + motif);
        }

        return syncRequestRepo.save(req);
    }

    public List<DossierSyncRequest> getSyncRequests() {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (u.isTopLevel() || u.isAdminCirt()) return syncRequestRepo.findAll();
        if (u.isDirecteurAntenne() && u.getAntenne() != null)
            return syncRequestRepo.findByDossierAntenneId(u.getAntenne().getId());
        if (u.isAgentAntenne()) return syncRequestRepo.findByRequestedById(u.getId());
        return List.of();
    }

    // ── Ouvrir (EN_ATTENTE → EN_COURS) ────────────────────────────────────

    @Transactional
    public Dossier ouvrirDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isCirtMember()) {
            throw new RuntimeException("Seul un membre CIRT peut ouvrir un dossier");
        }
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
        // CIRT intermédiaire ne peut ouvrir que les dossiers synchronisés
        if (!d.isSyncedToCirt() && !u.isTopLevel() && !u.isAdminCirt()) {
            throw new RuntimeException("Ce dossier n'est pas encore synchronisé au CIRT");
        }
        if (d.getStatus() == Status.EN_ATTENTE) {
            d.setStatus(Status.EN_COURS);
            Dossier saved = dossierRepo.save(d);
            activityLogService.log(u, ActionType.DOSSIER_OPENED,
                "Dossier", d.getId(), d.getTitle(),
                "Ouverture du dossier '" + d.getTitle() + "'");
            return saved;
        }
        return d;
    }

    // ── Validation (VALIDE) ────────────────────────────────────────────────

    @Transactional
    public Dossier validateDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isCirtMember()) {
            throw new RuntimeException("Seul un membre CIRT peut valider un dossier");
        }
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
        if (d.getStatus() != Status.EN_COURS) {
            throw new RuntimeException("Seul un dossier en cours peut être validé");
        }
        d.setStatus(Status.VALIDE);
        d.setValidatedBy(u);
        d.setValidatedAt(LocalDateTime.now());
        Dossier saved = dossierRepo.save(d);
        activityLogService.log(u, ActionType.DOSSIER_VALIDATED,
            "Dossier", d.getId(), d.getTitle(),
            "Validation du dossier '" + d.getTitle() + "' par " + u.getName());
        return saved;
    }

    // ── Tampon CIRT ────────────────────────────────────────────────────────
    // Apposé par le directeur ou le super_admin après validation CIRT.

    @Transactional
    public Dossier stampDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isTopLevel()) {
            throw new RuntimeException("Seul le directeur CIRT ou le super administrateur peut apposer le tampon");
        }
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
        if (d.getStatus() != Status.VALIDE) {
            throw new RuntimeException("Le dossier doit être validé avant d'apposer le tampon");
        }
        d.setStamped(true);
        d.setStampedBy(u);
        d.setStampedAt(LocalDateTime.now());
        Dossier saved = dossierRepo.save(d);
        activityLogService.log(u, ActionType.DOSSIER_STAMPED,
            "Dossier", d.getId(), d.getTitle(),
            "Tampon CIRT apposé sur le dossier '" + d.getTitle() + "' par " + u.getName());
        return saved;
    }

    // ── Sceau final ────────────────────────────────────────────────────────
    // Apposé par le directeur ou le super_admin (après tampon).

    @Transactional
    public Dossier sealDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isTopLevel()) {
            throw new RuntimeException("Seul le directeur CIRT ou le super administrateur peut apposer le sceau final");
        }
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
        if (!d.isStamped()) {
            throw new RuntimeException("Le tampon CIRT doit être apposé avant le sceau final");
        }
        d.setSealed(true);
        d.setSealedBy(u);
        d.setSealedAt(LocalDateTime.now());
        Dossier saved = dossierRepo.save(d);
        activityLogService.log(u, ActionType.DOSSIER_SEALED,
            "Dossier", d.getId(), d.getTitle(),
            "Sceau final apposé sur le dossier '" + d.getTitle() + "' par " + u.getName());
        return saved;
    }

    // ── Archivage ──────────────────────────────────────────────────────────

    @Transactional
    public Dossier archiveDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isTopLevel() && !u.isAdminCirt() && !u.isChefService()) {
            throw new RuntimeException("Droits insuffisants pour archiver");
        }
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
        if (d.getStatus() != Status.VALIDE) {
            throw new RuntimeException("Seul un dossier validé peut être archivé");
        }
        d.setStatus(Status.ARCHIVE);
        d.setArchivedBy(u);
        d.setArchivedAt(LocalDateTime.now());
        Dossier saved = dossierRepo.save(d);
        activityLogService.log(u, ActionType.DOSSIER_ARCHIVED,
            "Dossier", d.getId(), d.getTitle(),
            "Archivage du dossier '" + d.getTitle() + "'");
        return saved;
    }

    // ── Niveau de sécurité ─────────────────────────────────────────────────

    @Transactional
    public Dossier setSecurityLevel(Long id, SecurityLevel level) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        // Les agents simples ne peuvent jamais toucher à la sécurité
        if (u.isAgentAntenne() || u.isAgentCirt()) {
            throw new RuntimeException("Les agents ne peuvent pas modifier le niveau de sécurité");
        }

        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        // Si un supérieur a déjà configuré, un subordonné ne peut pas écraser
        if (d.getSecuritySetBy() != null && !canOverrideSecurity(u, d.getSecuritySetBy())) {
            throw new RuntimeException(
                "Le niveau de sécurité a été configuré par un supérieur et ne peut pas être modifié");
        }

        SecurityLevel old = d.getSecurityLevel();
        d.setSecurityLevel(level);
        d.setSecuritySetBy(u);
        // SECRET_PRIVE → désynchroniser automatiquement
        if (level == SecurityLevel.SECRET_PRIVE) {
            d.setSyncedToCirt(false);
        }
        Dossier saved = dossierRepo.save(d);
        activityLogService.log(u, ActionType.SECURITY_LEVEL_CHANGED,
            "Dossier", d.getId(), d.getTitle(),
            "Niveau de sécurité du dossier '" + d.getTitle() + "' : " + old + " → " + level);
        return saved;
    }

    // ── Suppression ────────────────────────────────────────────────────────

    @Transactional
    public void deleteDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        if (u.isTopLevel()) {
            activityLogService.log(u, ActionType.DOSSIER_DELETED,
                "Dossier", d.getId(), d.getTitle(),
                "Suppression du dossier '" + d.getTitle() + "'");
            dossierRepo.deleteById(id);
            return;
        }

        // L'agent peut supprimer ses propres dossiers tant qu'ils ne sont pas validés/archivés
        if (u.isAgentAntenne() && isCreator(d, u)) {
            if (d.getStatus() == Status.VALIDE || d.getStatus() == Status.ARCHIVE) {
                throw new RuntimeException("Vous ne pouvez pas supprimer un dossier validé ou archivé");
            }
            activityLogService.log(u, ActionType.DOSSIER_DELETED,
                "Dossier", d.getId(), d.getTitle(),
                "Suppression du dossier '" + d.getTitle() + "' par son créateur");
            dossierRepo.deleteById(id);
            return;
        }

        throw new RuntimeException("Vous n'avez pas les droits pour supprimer ce dossier");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private boolean isCreator(Dossier d, User u) {
        return d.getCreatedBy() != null && d.getCreatedBy().getId().equals(u.getId());
    }

    /**
     * Hiérarchie de sécurité : super_admin > directeur > admin_cirt > directeur_antenne > chef_service
     * Un acteur peut écraser la configuration d'un setter s'il est plus haut dans la hiérarchie.
     */
    private boolean canOverrideSecurity(User actor, User setter) {
        if (actor.isSuperAdmin()) return true;
        if (actor.isDirecteur() && !setter.isSuperAdmin()) return true;
        if (actor.isAdminCirt() && !setter.isSuperAdmin() && !setter.isDirecteur()) return true;
        if (actor.isDirecteurAntenne()
                && !setter.isSuperAdmin() && !setter.isDirecteur() && !setter.isAdminCirt()) return true;
        if (actor.isChefService()
                && !setter.isSuperAdmin() && !setter.isDirecteur()
                && !setter.isAdminCirt() && !setter.isDirecteurAntenne()) return true;
        return false;
    }

    private void checkReadAccess(Dossier d) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        if (u.isTopLevel()) return;

        if (u.isAdminCirt()) {
            if (d.getSecurityLevel() == SecurityLevel.SECRET_PRIVE && !isCreator(d, u))
                throw new RuntimeException("Accès refusé : dossier secret privé");
            return;
        }

        if (u.isChefService() || u.isAgentCirt()) {
            if (!d.isSyncedToCirt()) throw new RuntimeException("Accès refusé : dossier non synchronisé");
            if (d.getSecurityLevel() == SecurityLevel.SECRET_PRIVE) throw new RuntimeException("Accès refusé");
            if (d.getSecurityLevel() == SecurityLevel.ANTENNE_PRIVE && u.isAgentCirt())
                throw new RuntimeException("Accès refusé");
            return;
        }

        if (u.isDirecteurAntenne()) {
            if (u.getAntenne() == null || !u.getAntenne().getId().equals(
                    d.getAntenne() != null ? d.getAntenne().getId() : null))
                throw new RuntimeException("Accès refusé : dossier hors de votre antenne");
            if (d.getSecurityLevel() == SecurityLevel.SECRET_PRIVE && !isCreator(d, u))
                throw new RuntimeException("Accès refusé : dossier secret privé");
            return;
        }

        if (u.isAgentAntenne()) {
            if (isCreator(d, u)) return;
            SecurityLevel sl = d.getSecurityLevel();
            if (sl == SecurityLevel.SECRET_PRIVE || sl == SecurityLevel.ANTENNE_PRIVE
                    || sl == SecurityLevel.CIRT_ONLY)
                throw new RuntimeException("Accès refusé");
            if (u.getAntenne() == null || !u.getAntenne().getId().equals(
                    d.getAntenne() != null ? d.getAntenne().getId() : null))
                throw new RuntimeException("Accès refusé : dossier hors de votre antenne");
            Long catId = d.getCategory() != null ? d.getCategory().getId() : -1L;
            if (!permRepo.existsByUserIdAndCategoryId(u.getId(), catId))
                throw new RuntimeException("Accès refusé : catégorie non autorisée");
            return;
        }

        throw new RuntimeException("Accès refusé");
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    public static class DossierCreateRequest {
        private String title;
        private String description;
        private Long categoryId;
        private SecurityLevel securityLevel;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public SecurityLevel getSecurityLevel() { return securityLevel; }
        public void setSecurityLevel(SecurityLevel securityLevel) { this.securityLevel = securityLevel; }
    }
}
