package com.sync.Antic.controller;

import com.sync.Antic.entity.Dossier;
import com.sync.Antic.service.DossierService;
import com.sync.Antic.service.DossierService.DossierCreateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dossiers")
public class DossierController {

    @Autowired private DossierService dossierService;

    @GetMapping
    public List<Dossier> list() {
        return dossierService.getDossiers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(dossierService.getDossierById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DossierCreateRequest req) {
        try {
            return ResponseEntity.ok(dossierService.createDossier(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(dossierService.validateDossier(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archive(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(dossierService.archiveDossier(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            dossierService.deleteDossier(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Ouvre un dossier : EN_ATTENTE → EN_COURS */
    @PutMapping("/{id}/ouvrir")
    public ResponseEntity<?> ouvrir(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(dossierService.ouvrirDossier(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Récupère tous les dossiers visibles filtrés par catégories autorisées.
     * Utilisé par chef_service et agent_cirt qui voient les dossiers de leurs catégories
     * quelle que soit l'antenne d'origine.
     */
    @GetMapping("/by-categories")
    public ResponseEntity<?> byCategories(@RequestParam(required = false) java.util.List<Long> categoryId) {
        try {
            java.util.List<com.sync.Antic.entity.Dossier> all = dossierService.getDossiers();
            if (categoryId == null || categoryId.isEmpty()) {
                return ResponseEntity.ok(all);
            }
            java.util.Set<Long> catSet = new java.util.HashSet<>(categoryId);
            java.util.List<com.sync.Antic.entity.Dossier> filtered = all.stream()
                .filter(d -> d.getCategory() != null && catSet.contains(d.getCategory().getId()))
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(filtered);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

}