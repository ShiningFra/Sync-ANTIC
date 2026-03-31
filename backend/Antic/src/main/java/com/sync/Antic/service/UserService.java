package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service de gestion des utilisateurs.
 *
 * Règles de création selon le CDC :
 *
 * SUPER_ADMIN (Directeur CIRT) :
 *   → Peut créer : admin_cirt (sous-directeurs)
 *   → Peut supprimer : tous les comptes sauf lui-même
 *
 * ADMIN_CIRT (Sous-directeur) :
 *   → Peut créer : chef_service, agent_cirt (dans sa sous-direction)
 *   → Peut créer : directeur_antenne
 *   → Peut créer/supprimer les antennes
 *   → Peut gérer les catégories des utilisateurs (PermissionCategory)
 *
 * CHEF_SERVICE :
 *   → Ne peut pas créer d'utilisateurs (supervision uniquement)
 *
 * DIRECTEUR_ANTENNE :
 *   → Peut créer : agent_antenne (dans son antenne uniquement)
 *   → Peut supprimer : agent_antenne de son antenne
 *
 * AGENT_CIRT / AGENT_ANTENNE :
 *   → Ne peuvent pas créer d'utilisateurs
 */
@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private AntenneRepository antenneRepository;
    @Autowired private ServiceCirtRepository serviceCirtRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── Création ──────────────────────────────────────────────────────────

    public User createUser(UserCreateRequest req) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();

        // Vérifier email unique
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

        // ── SUPER_ADMIN ────────────────────────────────────────────────
        if (current.isSuperAdmin()) {
            // Peut créer uniquement des admin_cirt
            if (!"admin_cirt".equals(req.getRoleName())) {
                throw new RuntimeException("Le directeur ne peut créer que des administrateurs CIRT");
            }
            return userRepository.save(newUser);
        }

        // ── ADMIN_CIRT ─────────────────────────────────────────────────
        if (current.isAdminCirt()) {
            switch (req.getRoleName()) {
                case "chef_service":
                case "agent_cirt": {
                    if (req.getServiceId() == null) {
                        throw new RuntimeException("Un service CIRT est obligatoire pour ce rôle");
                    }
                    ServiceCirt svc = serviceCirtRepository.findById(req.getServiceId())
                        .orElseThrow(() -> new RuntimeException("Service introuvable"));
                    newUser.setService(svc);
                    return userRepository.save(newUser);
                }
                case "directeur_antenne": {
                    if (req.getAntenneId() == null) {
                        throw new RuntimeException("Une antenne est obligatoire pour un directeur d'antenne");
                    }
                    Antenne antenne = antenneRepository.findById(req.getAntenneId())
                        .orElseThrow(() -> new RuntimeException("Antenne introuvable"));
                    newUser.setAntenne(antenne);
                    return userRepository.save(newUser);
                }
                default:
                    throw new RuntimeException("Un admin CIRT ne peut pas créer le rôle : " + req.getRoleName());
            }
        }

        // ── DIRECTEUR_ANTENNE ──────────────────────────────────────────
        if (current.isDirecteurAntenne()) {
            if (!"agent_antenne".equals(req.getRoleName())) {
                throw new RuntimeException("Un directeur d'antenne ne peut créer que des agents d'antenne");
            }
            // Forcer l'antenne du directeur
            newUser.setAntenne(current.getAntenne());
            return userRepository.save(newUser);
        }

        throw new RuntimeException("Vous n'avez pas les droits pour créer des utilisateurs");
    }

    // ── Suppression ────────────────────────────────────────────────────────

    public void deleteUser(Long targetId) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        User target = userRepository.findById(targetId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (target.getId().equals(current.getId())) {
            throw new RuntimeException("Impossible de supprimer son propre compte");
        }

        // super_admin peut tout supprimer
        if (current.isSuperAdmin()) {
            userRepository.deleteById(targetId);
            return;
        }

        // admin_cirt peut supprimer chef_service, agent_cirt, directeur_antenne, agent_antenne
        if (current.isAdminCirt()) {
            String targetRole = target.getRoleName();
            if ("super_admin".equals(targetRole) || "admin_cirt".equals(targetRole)) {
                throw new RuntimeException("Droits insuffisants pour supprimer cet utilisateur");
            }
            userRepository.deleteById(targetId);
            return;
        }

        // directeur_antenne peut supprimer les agents de son antenne
        if (current.isDirecteurAntenne()) {
            if (!"agent_antenne".equals(target.getRoleName())) {
                throw new RuntimeException("Vous ne pouvez supprimer que les agents de votre antenne");
            }
            if (target.getAntenne() == null || !target.getAntenne().getId().equals(current.getAntenne().getId())) {
                throw new RuntimeException("Cet agent n'appartient pas à votre antenne");
            }
            userRepository.deleteById(targetId);
            return;
        }

        throw new RuntimeException("Vous n'avez pas les droits pour supprimer cet utilisateur");
    }

    // ── Liste ──────────────────────────────────────────────────────────────

    public List<User> listUsers() {
        User current = SecurityUtils.getCurrentUserDetails().getUser();

        if (current.isSuperAdmin() || current.isAdminCirt()) {
            return userRepository.findAll();
        }

        if (current.isChefService() && current.getService() != null) {
            return userRepository.findByServiceId(current.getService().getId());
        }

        if (current.isDirecteurAntenne() && current.getAntenne() != null) {
            return userRepository.findByAntenneId(current.getAntenne().getId());
        }

        // Agent : se voit seulement lui-même
        return List.of(current);
    }

    // ── DTO request ────────────────────────────────────────────────────────

    public static class UserCreateRequest {
        private String name;
        private String email;
        private String password;
        private String roleName;
        private Long antenneId;
        private Long serviceId;

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
    }
}
