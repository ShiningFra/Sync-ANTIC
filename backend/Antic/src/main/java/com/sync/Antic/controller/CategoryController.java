package com.sync.Antic.controller;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired private CategoryRepository          categoryRepo;
    @Autowired private PermissionCategoryRepository permRepo;
    @Autowired private UserRepository              userRepo;

    @GetMapping
    public List<Category> list() {
        return categoryRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Category category) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur peut créer des catégories"));
        }
        category.setCreatedBy(u);
        return ResponseEntity.ok(categoryRepo.save(category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur peut supprimer des catégories"));
        }
        categoryRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Lister les catégories autorisées d'un utilisateur */
    @GetMapping("/user/{userId}")
    public List<PermissionCategory> getUserPermissions(@PathVariable Long userId) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt() && !u.getId().equals(userId)) {
            throw new RuntimeException("Accès refusé");
        }
        return permRepo.findByUserId(userId);
    }

    /** Attribuer une catégorie à un utilisateur CIRT (admin_cirt uniquement) */
    @PostMapping("/grant")
    @Transactional
    public ResponseEntity<?> grantPermission(@RequestBody Map<String, Long> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        Long userId = body.get("userId");
        Long categoryId = body.get("categoryId");

        if (permRepo.existsByUserIdAndCategoryId(userId, categoryId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Permission déjà accordée"));
        }

        User target = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Category cat = categoryRepo.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        PermissionCategory perm = new PermissionCategory();
        perm.setUser(target);
        perm.setCategory(cat);
        return ResponseEntity.ok(permRepo.save(perm));
    }

    /** Révoquer une catégorie d'un utilisateur */
    @DeleteMapping("/revoke")
    @Transactional
    public ResponseEntity<?> revokePermission(@RequestBody Map<String, Long> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        permRepo.deleteByUserIdAndCategoryId(body.get("userId"), body.get("categoryId"));
        return ResponseEntity.noContent().build();
    }
}
