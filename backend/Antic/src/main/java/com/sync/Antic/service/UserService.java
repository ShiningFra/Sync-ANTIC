package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.entity.ActivityLog.ActionType;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Règles de création / suppression / modification des utilisateurs.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ HIÉRARCHIE                                                               │
 * │  super_admin                                                             │
 * │    └── peut créer : directeur                                            │
 * │  directeur (Directeur CIRT — un seul actif à la fois)                   │
 * │    └── peut créer : admin_cirt (→ sous-direction obligatoire)            │
 * │    └── peut créer : directeur_antenne (un seul actif par antenne)        │
 * │  admin_cirt (Sous-directeur — un seul actif par sous-direction)          │
 * │    └── peut créer : chef_service, agent_cirt (dans sa sous-direction)    │
 * │  directeur_antenne                                                       │
 * │    └── peut créer : agent_antenne (dans son antenne)                     │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Suppression / désactivation :
 *   super_admin  → peut tout faire sur tous les comptes sauf le sien
 *   directeur    → peut supprimer/désactiver admin_cirt, directeur_antenne,
 *                  chef_service, agent_cirt, agent_antenne
 *                  (pas le super_admin, pas un autre directeur)
 *   admin_cirt   → peut supprimer/désactiver chef_service et agent_cirt
 *                  de sa propre sous-direction uniquement
 *   directeur_antenne → peut supprimer agent_antenne de son antenne
 *
 * Unicité active :
 *   - Un seul directeur actif à la fois (création d'un nouveau → désactivation de l'ancien)
 *   - Un seul directeur_antenne actif par antenne
 *   - Un seul admin_cirt actif par sous-direction
 */
@Service
public class UserService {

    @Autowired private UserRepository          userRepository;
    @Autowired private RoleRepository          roleRepository;
    @Autowired private AntenneRepository       antenneRepository;
    @Autowired private ServiceCirtRepository   serviceCirtRepository;
    @Autowired private SousDirectionRepository sousDirectionRepository;
    @Autowired private ActivityLogService      activityLogService;
    @Autowired private PasswordEncoder         passwordEncoder;

    // ── Création ──────────────────────────────────────────────────────────

    @Transactional
    public User createUser(UserCreateRequest req) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email déjà utilisé : " + req.getEmail());
        }

        Role targetRole = roleRepository.findByName(req.getRoleName())
            .orElseThrow(() -> new RuntimeException("Rôle inconnu : " + req.getRoleName()));

        User newUser = new User();
        newUser.setName(req.getName());
        newUser.setEmail(req.getEmail());
        newUser.setPassword(passwordEncoder.encode(req.getPassword()));
        newUser.setRole(targetRole);
        newUser.setCreatedBy(current);
        newUser.setActive(true);

        // ── SUPER_ADMIN ────────────────────────────────────────────────────────
        // Peut créer uniquement un directeur CIRT.
        if (current.isSuperAdmin()) {
            if (!"directeur".equals(req.getRoleName())) {
                throw new RuntimeException("Le super administrateur ne peut créer que des directeurs CIRT");
            }
            // Un seul directeur actif à la fois : désactiver le précédent
            deactivatePreviousWithRole("directeur", current);
            User saved = userRepository.save(newUser);
            activityLogService.log(current, ActionType.USER_CREATED,
                "User", saved.getId(), saved.getName(),
                "Création du Directeur CIRT '" + saved.getName() + "' (" + saved.getEmail() + ")");
            return saved;
        }

        // ── DIRECTEUR ─────────────────────────────────────────────────────────
        // Peut créer : admin_cirt (→ sous-direction) et directeur_antenne.
        if (current.isDirecteur()) {
            switch (req.getRoleName()) {

                case "admin_cirt": {
                    // Création d'un sous-directeur : lui assigner une SD vide ou en créer une
                    User saved = userRepository.save(newUser);
                    assignOrCreateSousDirection(saved, req.getSousDirectionId(), req.getSousDirectionName());
                    activityLogService.log(current, ActionType.USER_CREATED,
                        "User", saved.getId(), saved.getName(),
                        "Création du Sous-Directeur '" + saved.getName() + "' par le Directeur");
                    return saved;
                }

                case "directeur_antenne": {
                    if (req.getAntenneId() == null) {
                        throw new RuntimeException("Une antenne est obligatoire pour un directeur d'antenne");
                    }
                    Antenne antenne = antenneRepository.findById(req.getAntenneId())
                        .orElseThrow(() -> new RuntimeException("Antenne introuvable"));
                    // Un seul directeur_antenne actif par antenne
                    deactivatePreviousDirecteursAntenne(antenne.getId(), current);
                    newUser.setAntenne(antenne);
                    User saved = userRepository.save(newUser);
                    activityLogService.log(current, ActionType.USER_CREATED,
                        "User", saved.getId(), saved.getName(),
                        "Création du Directeur d'Antenne '" + saved.getName()
                            + "' pour antenne '" + antenne.getName() + "'");
                    return saved;
                }

                default:
                    throw new RuntimeException(
                        "Le directeur CIRT peut uniquement créer des sous-directeurs (admin_cirt) "
                        + "ou des directeurs d'antenne");
            }
        }

        // ── ADMIN_CIRT (Sous-directeur) ────────────────────────────────────────
        // Peut créer : chef_service et agent_cirt dans sa propre sous-direction.
        if (current.isAdminCirt()) {
            switch (req.getRoleName()) {
                case "chef_service":
                case "agent_cirt": {
                    if (req.getServiceId() == null) {
                        throw new RuntimeException("Un service CIRT est obligatoire pour ce rôle");
                    }
                    ServiceCirt svc = serviceCirtRepository.findById(req.getServiceId())
                        .orElseThrow(() -> new RuntimeException("Service introuvable"));
                    // Vérifier que le service appartient à la sous-direction du sous-directeur
                    SousDirection mySD = sousDirectionRepository.findByDirecteurId(current.getId()).orElse(null);
                    if (mySD != null && svc.getSousDirection() != null
                            && !svc.getSousDirection().getId().equals(mySD.getId())) {
                        throw new RuntimeException("Ce service n'appartient pas à votre sous-direction");
                    }
                    newUser.setService(svc);
                    User saved = userRepository.save(newUser);
                    activityLogService.log(current, ActionType.USER_CREATED,
                        "User", saved.getId(), saved.getName(),
                        "Création de '" + saved.getName() + "' (rôle: " + req.getRoleName()
                            + ") dans service '" + svc.getName() + "'");
                    return saved;
                }
                default:
                    throw new RuntimeException("Un sous-directeur ne peut créer que des chefs de service ou agents CIRT");
            }
        }

        // ── DIRECTEUR_ANTENNE ──────────────────────────────────────────────────
        if (current.isDirecteurAntenne()) {
            if (!"agent_antenne".equals(req.getRoleName())) {
                throw new RuntimeException("Un directeur d'antenne ne peut créer que des agents d'antenne");
            }
            if (current.getAntenne() == null) {
                throw new RuntimeException("Votre compte n'est associé à aucune antenne");
            }
            newUser.setAntenne(current.getAntenne());
            User saved = userRepository.save(newUser);
            activityLogService.log(current, ActionType.USER_CREATED,
                "User", saved.getId(), saved.getName(),
                "Création de l'Agent d'Antenne '" + saved.getName()
                    + "' dans antenne '" + current.getAntenne().getName() + "'");
            return saved;
        }

        throw new RuntimeException("Vous n'avez pas les droits pour créer des utilisateurs");
    }

    // ── Suppression ────────────────────────────────────────────────────────

    @Transactional
    public void deleteUser(Long targetId) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (target.getId().equals(current.getId())) {
            throw new RuntimeException("Impossible de supprimer son propre compte");
        }

        // super_admin : peut tout supprimer sauf lui-même
        if (current.isSuperAdmin()) {
            logAndDelete(current, target);
            return;
        }

        // directeur : peut supprimer tout le monde sauf super_admin et autres directeurs
        if (current.isDirecteur()) {
            String tr = target.getRoleName();
            if ("super_admin".equals(tr) || "directeur".equals(tr)) {
                throw new RuntimeException("Vous ne pouvez pas supprimer ce compte");
            }
            logAndDelete(current, target);
            return;
        }

        // admin_cirt : peut supprimer chef_service et agent_cirt de SA sous-direction
        if (current.isAdminCirt()) {
            String tr = target.getRoleName();
            if (!"chef_service".equals(tr) && !"agent_cirt".equals(tr)) {
                throw new RuntimeException("Un sous-directeur ne peut supprimer que les chefs de service et agents CIRT");
            }
            // Vérifier même sous-direction
            SousDirection mySD = sousDirectionRepository.findByDirecteurId(current.getId()).orElse(null);
            if (mySD != null && target.getService() != null
                    && target.getService().getSousDirection() != null
                    && !target.getService().getSousDirection().getId().equals(mySD.getId())) {
                throw new RuntimeException("Cet utilisateur n'appartient pas à votre sous-direction");
            }
            logAndDelete(current, target);
            return;
        }

        // directeur_antenne : peut supprimer les agents_antenne de son antenne
        if (current.isDirecteurAntenne()) {
            if (!"agent_antenne".equals(target.getRoleName())) {
                throw new RuntimeException("Un directeur d'antenne ne peut supprimer que les agents de son antenne");
            }
            if (current.getAntenne() == null || target.getAntenne() == null
                    || !target.getAntenne().getId().equals(current.getAntenne().getId())) {
                throw new RuntimeException("Cet agent n'appartient pas à votre antenne");
            }
            logAndDelete(current, target);
            return;
        }

        throw new RuntimeException("Vous n'avez pas les droits pour supprimer cet utilisateur");
    }

    private void logAndDelete(User actor, User target) {
        activityLogService.log(actor, ActionType.USER_DELETED,
            "User", target.getId(), target.getName(),
            "Suppression de '" + target.getName() + "' (" + target.getEmail()
                + ", rôle: " + target.getRoleName() + ")");
        userRepository.deleteById(target.getId());
    }

    // ── Activation / Désactivation ─────────────────────────────────────────

    @Transactional
    public User toggleActive(Long targetId, boolean active) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (target.getId().equals(current.getId())) {
            throw new RuntimeException("Impossible de modifier son propre statut");
        }

        String tr = target.getRoleName();

        // super_admin : peut activer/désactiver n'importe qui
        if (current.isSuperAdmin()) {
            return doToggle(current, target, active);
        }

        // directeur : peut activer/désactiver tout sauf super_admin et autres directeurs
        if (current.isDirecteur()) {
            if ("super_admin".equals(tr) || "directeur".equals(tr)) {
                throw new RuntimeException("Vous ne pouvez pas modifier le statut de ce compte");
            }
            return doToggle(current, target, active);
        }

        // admin_cirt : peut activer/désactiver chef_service et agent_cirt de SA sous-direction
        if (current.isAdminCirt()) {
            if (!"chef_service".equals(tr) && !"agent_cirt".equals(tr)) {
                throw new RuntimeException("Vous ne pouvez modifier que le statut des chefs de service et agents CIRT");
            }
            SousDirection mySD = sousDirectionRepository.findByDirecteurId(current.getId()).orElse(null);
            if (mySD != null && target.getService() != null
                    && target.getService().getSousDirection() != null
                    && !target.getService().getSousDirection().getId().equals(mySD.getId())) {
                throw new RuntimeException("Cet utilisateur n'appartient pas à votre sous-direction");
            }
            return doToggle(current, target, active);
        }

        // directeur_antenne : peut activer/désactiver ses agents
        if (current.isDirecteurAntenne()) {
            if (!"agent_antenne".equals(tr)) {
                throw new RuntimeException("Vous ne pouvez modifier que le statut des agents de votre antenne");
            }
            if (current.getAntenne() == null || target.getAntenne() == null
                    || !target.getAntenne().getId().equals(current.getAntenne().getId())) {
                throw new RuntimeException("Cet agent n'appartient pas à votre antenne");
            }
            return doToggle(current, target, active);
        }

        throw new RuntimeException("Droits insuffisants");
    }

    private User doToggle(User actor, User target, boolean active) {
        target.setActive(active);
        userRepository.save(target);
        activityLogService.log(actor,
            active ? ActionType.USER_ACTIVATED : ActionType.USER_DEACTIVATED,
            "User", target.getId(), target.getName(),
            (active ? "Activation" : "Désactivation") + " du compte '" + target.getName() + "'");
        return target;
    }

    // ── Modification de rôle / poste ───────────────────────────────────────

    @Transactional
    public User updateUserRole(Long targetId, UserRoleUpdateRequest req) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();

        // Seuls super_admin et directeur peuvent changer les rôles
        if (!current.isSuperAdmin() && !current.isDirecteur()) {
            throw new RuntimeException("Seul le super administrateur ou le directeur peut modifier les rôles");
        }

        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Le directeur ne peut pas modifier le super_admin ni un autre directeur
        if (current.isDirecteur()) {
            String tr = target.getRoleName();
            if ("super_admin".equals(tr) || "directeur".equals(tr)) {
                throw new RuntimeException("Vous ne pouvez pas modifier ce compte");
            }
        }

        StringBuilder desc = new StringBuilder("Modification du compte '" + target.getName() + "' : ");

        if (req.getRoleName() != null && !req.getRoleName().isBlank()) {
            // Seul le super_admin peut attribuer le rôle directeur ou super_admin
            if (("super_admin".equals(req.getRoleName()) || "directeur".equals(req.getRoleName()))
                    && !current.isSuperAdmin()) {
                throw new RuntimeException("Seul le super administrateur peut attribuer ce rôle");
            }
            Role newRole = roleRepository.findByName(req.getRoleName())
                .orElseThrow(() -> new RuntimeException("Rôle inconnu : " + req.getRoleName()));
            desc.append("rôle ").append(target.getRoleName()).append(" → ").append(req.getRoleName()).append("; ");
            target.setRole(newRole);
            activityLogService.log(current, ActionType.USER_ROLE_CHANGED,
                "User", target.getId(), target.getName(), desc.toString());
        }

        if (req.getAntenneId() != null) {
            Antenne antenne = antenneRepository.findById(req.getAntenneId())
                .orElseThrow(() -> new RuntimeException("Antenne introuvable"));
            desc.append("antenne → ").append(antenne.getName()).append("; ");
            target.setAntenne(antenne);
            activityLogService.log(current, ActionType.USER_ANTENNE_CHANGED,
                "User", target.getId(), target.getName(), desc.toString());
        }

        if (req.getServiceId() != null) {
            ServiceCirt svc = serviceCirtRepository.findById(req.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service introuvable"));
            desc.append("service → ").append(svc.getName()).append("; ");
            target.setService(svc);
            activityLogService.log(current, ActionType.USER_SERVICE_CHANGED,
                "User", target.getId(), target.getName(), desc.toString());
        }

        return userRepository.save(target);
    }

    // ── Mise à jour du profil ──────────────────────────────────────────────

    @Transactional
    public User updateProfile(User target, String newName, String newEmail, String newPassword) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        boolean changed = false;
        StringBuilder desc = new StringBuilder("Mise à jour du profil de '" + target.getName() + "' : ");

        if (newName != null && !newName.isBlank() && !newName.equals(target.getName())) {
            desc.append("nom modifié; ");
            target.setName(newName);
            changed = true;
        }
        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(target.getEmail())) {
            desc.append("email modifié; ");
            target.setEmail(newEmail);
            changed = true;
        }
        User saved = userRepository.save(target);
        if (changed) {
            activityLogService.log(current, ActionType.USER_PROFILE_UPDATED,
                "User", target.getId(), target.getName(), desc.toString());
        }
        if (newPassword != null && !newPassword.isBlank()) {
            // Jamais de mot de passe dans les logs
            activityLogService.log(current, ActionType.USER_PASSWORD_CHANGED,
                "User", target.getId(), target.getName(),
                "Changement de mot de passe pour '" + target.getName() + "' (contenu non journalisé)");
            saved.setPassword(passwordEncoder.encode(newPassword));
            saved = userRepository.save(saved);
        }
        return saved;
    }

    // ── Listing ────────────────────────────────────────────────────────────

    public List<User> listUsers() {
        User current = SecurityUtils.getCurrentUserDetails().getUser();

        // super_admin et directeur voient tout le monde
        if (current.isSuperAdmin() || current.isDirecteur()) {
            return userRepository.findAll();
        }
        // admin_cirt : voit tous les membres CIRT
        if (current.isAdminCirt()) {
            return userRepository.findAll(); // filtrage fin possible ultérieurement
        }
        // chef_service : voit son service
        if (current.isChefService() && current.getService() != null) {
            return userRepository.findByServiceId(current.getService().getId());
        }
        // directeur_antenne : voit son antenne
        if (current.isDirecteurAntenne() && current.getAntenne() != null) {
            return userRepository.findByAntenneId(current.getAntenne().getId());
        }
        // Agent : se voit lui-même
        return List.of(current);
    }

    // ── Helpers privés ─────────────────────────────────────────────────────

    /** Désactive tous les comptes actifs ayant ce rôle (unicité active) */
    private void deactivatePreviousWithRole(String roleName, User actor) {
        userRepository.findByRoleName(roleName).stream()
            .filter(User::isActive)
            .forEach(u -> {
                u.setActive(false);
                userRepository.save(u);
                activityLogService.log(actor, ActionType.USER_DEACTIVATED,
                    "User", u.getId(), u.getName(),
                    "Désactivation automatique du " + roleName + " précédent '" + u.getName()
                        + "' (remplacement par nouveau " + roleName + ")");
            });
    }

    /** Désactive les directeurs_antenne actifs d'une antenne avant d'en affecter un nouveau */
    private void deactivatePreviousDirecteursAntenne(Long antenneId, User actor) {
        userRepository.findByAntenneIdAndRoleName(antenneId, "directeur_antenne").stream()
            .filter(User::isActive)
            .forEach(u -> {
                u.setActive(false);
                userRepository.save(u);
                activityLogService.log(actor, ActionType.USER_DEACTIVATED,
                    "User", u.getId(), u.getName(),
                    "Désactivation automatique du directeur d'antenne précédent '"
                        + u.getName() + "' (remplacement)");
            });
    }

    /** Crée ou assigne une sous-direction libre à un nouveau sous-directeur */
    @Transactional
    private void assignOrCreateSousDirection(User sousDirecteur, Long sousDirectionId, String sousDirectionName) {
        SousDirection sd;
        if (sousDirectionId != null) {
            sd = sousDirectionRepository.findById(sousDirectionId)
                .orElseThrow(() -> new RuntimeException("Sous-direction introuvable"));
            if (sd.getDirecteur() != null && sd.getDirecteur().isActive()) {
                throw new RuntimeException("Cette sous-direction a déjà un sous-directeur actif");
            }
        } else {
            String name = (sousDirectionName != null && !sousDirectionName.isBlank())
                ? sousDirectionName
                : "Sous-Direction de " + sousDirecteur.getName();
            sd = new SousDirection();
            sd.setName(name);
        }
        sd.setDirecteur(sousDirecteur);
        sousDirectionRepository.save(sd);
        activityLogService.log(sousDirecteur, ActionType.SOUS_DIRECTION_UPDATED,
            "SousDirection", sd.getId(), sd.getName(),
            "Sous-direction '" + sd.getName() + "' assignée au sous-directeur '" + sousDirecteur.getName() + "'");
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    public static class UserCreateRequest {
        private String name;
        private String email;
        private String password;
        private String roleName;
        private Long antenneId;
        private Long serviceId;
        private Long sousDirectionId;
        private String sousDirectionName;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRoleName() { return roleName; }
        public void setRoleName(String roleName) { this.roleName = roleName; }
        public Long getAntenneId() { return antenneId; }
        public void setAntenneId(Long antenneId) { this.antenneId = antenneId; }
        public Long getServiceId() { return serviceId; }
        public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
        public Long getSousDirectionId() { return sousDirectionId; }
        public void setSousDirectionId(Long sousDirectionId) { this.sousDirectionId = sousDirectionId; }
        public String getSousDirectionName() { return sousDirectionName; }
        public void setSousDirectionName(String sousDirectionName) { this.sousDirectionName = sousDirectionName; }
    }

    public static class UserRoleUpdateRequest {
        private String roleName;
        private Long antenneId;
        private Long serviceId;

        public String getRoleName() { return roleName; }
        public void setRoleName(String roleName) { this.roleName = roleName; }
        public Long getAntenneId() { return antenneId; }
        public void setAntenneId(Long antenneId) { this.antenneId = antenneId; }
        public Long getServiceId() { return serviceId; }
        public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    }
}
