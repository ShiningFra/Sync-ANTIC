package com.sync.Antic.controller;

import com.sync.Antic.entity.*;
import com.sync.Antic.entity.ActivityLog.ActionType;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired private CategoryRepository           categoryRepo;
    @Autowired private PermissionCategoryRepository permRepo;
    @Autowired private UserRepository               userRepo;
    @Autowired private AntenneCategoryRepository    antenneCatRepo;
    @Autowired private AntenneRepository            antenneRepo;
    @Autowired private ActivityLogService           activityLogService;

    @GetMapping
    public List<Category> list() {
        return categoryRepo.findAll();
    }

    /**
     * Créer une catégorie.
     * Seul le directeur CIRT ou le super_admin peuvent créer des catégories.
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Category category) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur CIRT peut créer des catégories"));
        }
        category.setCreatedBy(u);
        Category saved = categoryRepo.save(category);
        activityLogService.log(u, ActionType.CATEGORY_CREATED,
            "Category", saved.getId(), saved.getName(),
            "Création de la catégorie '" + saved.getName() + "'");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur CIRT peut supprimer des catégories"));
        }
        Category cat = categoryRepo.findById(id).orElse(null);
        categoryRepo.deleteById(id);
        activityLogService.log(u, ActionType.CATEGORY_DELETED,
            "Category", id, cat != null ? cat.getName() : String.valueOf(id),
            "Suppression de la catégorie '" + (cat != null ? cat.getName() : id) + "'");
        return ResponseEntity.noContent().build();
    }

    /**
     * Modifier le niveau de sécurité d'une catégorie.
     * Hiérarchie : super_admin > directeur > admin_cirt > directeur_antenne
     * Agents simples : JAMAIS.
     * Si un supérieur a déjà configuré, un subordonné ne peut pas écraser.
     */
    @PutMapping("/{id}/security")
    @Transactional
    public ResponseEntity<?> setSecurity(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (u.isAgentAntenne() || u.isAgentCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Les agents ne peuvent pas modifier le niveau de sécurité"));
        }
        Category cat = categoryRepo.findById(id).orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        if (cat.getSecuritySetBy() != null && !canOverrideSecurity(u, cat.getSecuritySetBy())) {
            return ResponseEntity.status(403).body(
                Map.of("error", "Un supérieur hiérarchique a déjà configuré ce niveau de sécurité"));
        }

        SecurityLevel old = cat.getSecurityLevel();
        cat.setSecurityLevel(SecurityLevel.valueOf(body.get("securityLevel")));
        cat.setSecuritySetBy(u);
        categoryRepo.save(cat);
        activityLogService.log(u, ActionType.SECURITY_LEVEL_CHANGED,
            "Category", cat.getId(), cat.getName(),
            "Niveau de sécurité catégorie '" + cat.getName() + "' : " + old + " → " + cat.getSecurityLevel());
        return ResponseEntity.ok(cat);
    }

    // ── Affiliation antennes ───────────────────────────────────────────────

    @GetMapping("/{id}/antennes")
    public ResponseEntity<?> getAntennes(@PathVariable Long id) {
        List<AntenneCategory> links = antenneCatRepo.findByCategoryId(id);
        return ResponseEntity.ok(links.stream().map(AntenneCategory::getAntenne).collect(Collectors.toList()));
    }

    @PostMapping("/{id}/antennes")
    @Transactional
    public ResponseEntity<?> addAntenne(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        Long antenneId = body.get("antenneId");
        if (antenneCatRepo.existsByAntenneIdAndCategoryId(antenneId, id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Antenne déjà affiliée"));
        }
        Antenne antenne = antenneRepo.findById(antenneId).orElseThrow(() -> new RuntimeException("Antenne introuvable"));
        Category cat = categoryRepo.findById(id).orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        AntenneCategory link = new AntenneCategory();
        link.setAntenne(antenne); link.setCategory(cat);
        antenneCatRepo.save(link);
        activityLogService.log(u, ActionType.ANTENNE_CATEGORIES_UPDATED,
            "Category", id, cat.getName(),
            "Affiliation antenne '" + antenne.getName() + "' à catégorie '" + cat.getName() + "'");
        return ResponseEntity.ok(Map.of("message", "Antenne affiliée"));
    }

    @DeleteMapping("/{id}/antennes/{antenneId}")
    @Transactional
    public ResponseEntity<?> removeAntenne(@PathVariable Long id, @PathVariable Long antenneId) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        antenneCatRepo.deleteByAntenneIdAndCategoryId(antenneId, id);
        return ResponseEntity.noContent().build();
    }

    // ── Permissions utilisateurs ───────────────────────────────────────────

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPermissions(@PathVariable Long userId) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()
                && !u.isDirecteurAntenne() && !u.getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        return ResponseEntity.ok(permRepo.findByUserId(userId));
    }

    /**
     * Accorder une permission catégorie à un utilisateur.
     * directeur, super_admin, admin_cirt, directeur_antenne (pour les agents de son antenne).
     */
    @PostMapping("/grant")
    @Transactional
    public ResponseEntity<?> grantPermission(@RequestBody Map<String, Long> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt() && !u.isDirecteurAntenne()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        Long userId = body.get("userId"), categoryId = body.get("categoryId");
        if (permRepo.existsByUserIdAndCategoryId(userId, categoryId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Permission déjà accordée"));
        }
        User target = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Category cat = categoryRepo.findById(categoryId).orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        // directeur_antenne ne peut accorder des permissions qu'aux agents de son antenne
        if (u.isDirecteurAntenne()) {
            if (!target.isAgentAntenne() || u.getAntenne() == null
                    || target.getAntenne() == null
                    || !target.getAntenne().getId().equals(u.getAntenne().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez accorder des permissions qu'aux agents de votre antenne"));
            }
            // Vérifier que la catégorie est affiliée à son antenne
            if (!antenneCatRepo.existsByAntenneIdAndCategoryId(u.getAntenne().getId(), categoryId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Cette catégorie n'est pas disponible pour votre antenne"));
            }
        }

        PermissionCategory perm = new PermissionCategory();
        perm.setUser(target); perm.setCategory(cat);
        PermissionCategory saved = permRepo.save(perm);
        activityLogService.log(u, ActionType.PERMISSION_GRANTED,
            "User", target.getId(), target.getName(),
            "Permission catégorie '" + cat.getName() + "' accordée à '" + target.getName() + "'");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/revoke")
    @Transactional
    public ResponseEntity<?> revokePermission(@RequestBody Map<String, Long> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt() && !u.isDirecteurAntenne()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        Long userId = body.get("userId"), categoryId = body.get("categoryId");
        User target = userRepo.findById(userId).orElse(null);
        Category cat = categoryRepo.findById(categoryId).orElse(null);
        permRepo.deleteByUserIdAndCategoryId(userId, categoryId);
        activityLogService.log(u, ActionType.PERMISSION_REVOKED,
            "User", userId, target != null ? target.getName() : String.valueOf(userId),
            "Permission catégorie '" + (cat != null ? cat.getName() : categoryId)
                + "' révoquée pour '" + (target != null ? target.getName() : userId) + "'");
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Hiérarchie sécurité : super_admin > directeur > admin_cirt > directeur_antenne > chef_service
     */
    private boolean canOverrideSecurity(User actor, User setter) {
        if (actor.isSuperAdmin()) return true;
        if (actor.isDirecteur() && !setter.isSuperAdmin()) return true;
        if (actor.isAdminCirt() && !setter.isSuperAdmin() && !setter.isDirecteur()) return true;
        if (actor.isDirecteurAntenne()
                && !setter.isSuperAdmin() && !setter.isDirecteur() && !setter.isAdminCirt()) return true;
        return false;
    }
}
