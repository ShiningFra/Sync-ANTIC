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
@RequestMapping("/antennes")
public class AntenneController {

    @Autowired private AntenneRepository         antenneRepo;
    @Autowired private CategoryRepository        categoryRepo;
    @Autowired private AntenneCategoryRepository antenneCatRepo;
    @Autowired private ActivityLogService        activityLogService;

    @GetMapping
    public List<Antenne> list() {
        return antenneRepo.findAll();
    }

    /**
     * Créer une antenne.
     * Seul le directeur CIRT ou le super_admin peuvent créer des antennes.
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur CIRT peut créer des antennes"));
        }
        Antenne antenne = new Antenne();
        antenne.setName(body.get("name"));
        Antenne saved = antenneRepo.save(antenne);
        activityLogService.log(u, ActionType.ANTENNE_CREATED,
            "Antenne", saved.getId(), saved.getName(),
            "Création de l'antenne '" + saved.getName() + "'");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur CIRT peut supprimer des antennes"));
        }
        Antenne antenne = antenneRepo.findById(id).orElse(null);
        antenneRepo.deleteById(id);
        activityLogService.log(u, ActionType.ANTENNE_DELETED,
            "Antenne", id, antenne != null ? antenne.getName() : String.valueOf(id),
            "Suppression de l'antenne '" + (antenne != null ? antenne.getName() : id) + "'");
        return ResponseEntity.noContent().build();
    }

    // ── Affiliation catégories ─────────────────────────────────────────────

    @GetMapping("/{id}/categories")
    public ResponseEntity<?> getCategories(@PathVariable Long id) {
        List<AntenneCategory> links = antenneCatRepo.findByAntenneId(id);
        List<Category> cats = links.stream().map(AntenneCategory::getCategory).collect(Collectors.toList());
        return ResponseEntity.ok(cats);
    }

    /**
     * Affilier une catégorie à une antenne.
     * Configurable par le directeur, un admin_cirt ou un directeur_antenne (pour son antenne).
     */
    @PostMapping("/{id}/categories")
    @Transactional
    public ResponseEntity<?> addCategory(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        // directeur_antenne peut configurer uniquement son antenne
        if (u.isDirecteurAntenne()) {
            if (u.getAntenne() == null || !u.getAntenne().getId().equals(id)) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez configurer que votre propre antenne"));
            }
        } else if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        Long categoryId = body.get("categoryId");
        if (antenneCatRepo.existsByAntenneIdAndCategoryId(id, categoryId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Catégorie déjà affiliée à cette antenne"));
        }
        Antenne antenne = antenneRepo.findById(id).orElseThrow(() -> new RuntimeException("Antenne introuvable"));
        Category cat = categoryRepo.findById(categoryId).orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        AntenneCategory link = new AntenneCategory();
        link.setAntenne(antenne);
        link.setCategory(cat);
        antenneCatRepo.save(link);
        activityLogService.log(u, ActionType.ANTENNE_CATEGORIES_UPDATED,
            "Antenne", id, antenne.getName(),
            "Affiliation catégorie '" + cat.getName() + "' à antenne '" + antenne.getName() + "'");
        return ResponseEntity.ok(Map.of("message", "Catégorie affiliée"));
    }

    @DeleteMapping("/{id}/categories/{categoryId}")
    @Transactional
    public ResponseEntity<?> removeCategory(@PathVariable Long id, @PathVariable Long categoryId) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (u.isDirecteurAntenne()) {
            if (u.getAntenne() == null || !u.getAntenne().getId().equals(id)) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez configurer que votre propre antenne"));
            }
        } else if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        antenneCatRepo.deleteByAntenneIdAndCategoryId(id, categoryId);
        activityLogService.log(u, ActionType.ANTENNE_CATEGORIES_UPDATED,
            "Antenne", id, String.valueOf(id),
            "Retrait catégorie id=" + categoryId + " de antenne id=" + id);
        return ResponseEntity.noContent().build();
    }
}
