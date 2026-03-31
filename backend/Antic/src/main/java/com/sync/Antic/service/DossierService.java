package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service de gestion des dossiers.
 *
 * Règles de visibilité (CDC §4.4) :
 *   super_admin        → Voit TOUT
 *   admin_cirt         → Voit tout
 *   chef_service       → Voit les dossiers de son service
 *   agent_cirt         → Voit uniquement les dossiers de son service
 *   directeur_antenne  → Voit tous les dossiers de son antenne
 *   agent_antenne      → Voit uniquement ses propres dossiers
 *
 * Règles de création (CDC §5.1) :
 *   Seuls les agents des antennes (agent_antenne) créent des dossiers.
 *   Les CIRT supervisent et traitent.
 *
 * Règles de validation (CDC §11) :
 *   Un dossier validé peut être archivé.
 *   Seul un CIRT (chef_service ou admin_cirt ou super_admin) peut valider.
 */
@Service
public class DossierService {

    @Autowired private DossierRepository      dossierRepo;
    @Autowired private CategoryRepository     categoryRepo;
    @Autowired private AntenneRepository      antenneRepo;
    @Autowired private ServiceCirtRepository  serviceCirtRepo;
    @Autowired private PermissionCategoryRepository permRepo;

    // ── Lecture ────────────────────────────────────────────────────────────

    public List<Dossier> getDossiers() {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        // super_admin ou admin_cirt → tout voir
        if (u.isSuperAdmin() || u.isAdminCirt()) {
            return dossierRepo.findAll();
        }

        // chef_service → dossiers assignés à son service
        if (u.isChefService() && u.getService() != null) {
            return dossierRepo.findByServiceId(u.getService().getId());
        }

        // agent_cirt → dossiers de son service (mêmes catégories autorisées)
        if (u.isAgentCirt() && u.getService() != null) {
            List<Long> allowedCatIds = permRepo.findByUserId(u.getId())
                .stream().map(p -> p.getCategory().getId()).collect(Collectors.toList());
            if (allowedCatIds.isEmpty()) {
                return dossierRepo.findByServiceId(u.getService().getId());
            }
            return dossierRepo.findByServiceIdAndCategoryIdIn(u.getService().getId(), allowedCatIds);
        }

        // directeur_antenne → tous les dossiers de son antenne
        if (u.isDirecteurAntenne() && u.getAntenne() != null) {
            return dossierRepo.findByAntenneId(u.getAntenne().getId());
        }

        // agent_antenne → uniquement ses propres dossiers
        if (u.isAgentAntenne()) {
            return dossierRepo.findByCreatedById(u.getId());
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

        // Seuls les agents antenne créent des dossiers
        if (!u.isAgentAntenne()) {
            throw new RuntimeException("Seuls les agents des antennes peuvent créer des dossiers");
        }

        // Vérifier que la catégorie est autorisée pour cet utilisateur
        Category cat = categoryRepo.findById(req.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        boolean hasPermission = permRepo.existsByUserIdAndCategoryId(u.getId(), cat.getId());
        if (!hasPermission) {
            throw new RuntimeException("Vous n'avez pas accès à cette catégorie");
        }

        Dossier d = new Dossier();
        d.setTitle(req.getTitle());
        d.setDescription(req.getDescription());
        d.setCategory(cat);
        d.setAntenne(u.getAntenne());
        d.setCreatedBy(u);
        d.setStatus(Status.EN_COURS);
        d.setCreatedAt(LocalDateTime.now());

        return dossierRepo.save(d);
    }

    // ── Validation ─────────────────────────────────────────────────────────

    @Transactional
    public Dossier validateDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        // Seuls les CIRT peuvent valider
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

        return dossierRepo.save(d);
    }

    // ── Archivage ──────────────────────────────────────────────────────────

    @Transactional
    public Dossier archiveDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        if (!u.isSuperAdmin() && !u.isAdminCirt() && !u.isChefService()) {
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

        return dossierRepo.save(d);
    }

    // ── Suppression ────────────────────────────────────────────────────────

    @Transactional
    public void deleteDossier(Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        Dossier d = dossierRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        // super_admin peut supprimer n'importe quoi (même les archives)
        if (u.isSuperAdmin()) {
            dossierRepo.deleteById(id);
            return;
        }

        // L'agent antenne peut supprimer ses propres dossiers EN_COURS
        if (u.isAgentAntenne() && d.getCreatedBy().getId().equals(u.getId())) {
            if (d.getStatus() != Status.EN_COURS) {
                throw new RuntimeException("Vous ne pouvez supprimer qu'un dossier en cours");
            }
            dossierRepo.deleteById(id);
            return;
        }

        throw new RuntimeException("Vous n'avez pas les droits pour supprimer ce dossier");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void checkReadAccess(Dossier d) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();

        if (u.isSuperAdmin() || u.isAdminCirt()) return;

        if (u.isChefService() || u.isAgentCirt()) {
            if (u.getService() != null && u.getService().getId().equals(
                    d.getService() != null ? d.getService().getId() : null)) return;
            throw new RuntimeException("Accès refusé : dossier hors de votre service");
        }

        if (u.isDirecteurAntenne()) {
            if (u.getAntenne() != null && u.getAntenne().getId().equals(
                    d.getAntenne() != null ? d.getAntenne().getId() : null)) return;
            throw new RuntimeException("Accès refusé : dossier hors de votre antenne");
        }

        if (u.isAgentAntenne()) {
            if (d.getCreatedBy() != null && d.getCreatedBy().getId().equals(u.getId())) return;
            throw new RuntimeException("Accès refusé : ce n'est pas votre dossier");
        }

        throw new RuntimeException("Accès refusé");
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    public static class DossierCreateRequest {
        private String title;
        private String description;
        private Long categoryId;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    }
}
