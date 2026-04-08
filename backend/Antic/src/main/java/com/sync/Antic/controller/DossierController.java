package com.sync.Antic.controller;

import com.sync.Antic.entity.DossierSyncRequest;
import com.sync.Antic.entity.SecurityLevel;
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
    public ResponseEntity<?> list() {
        try { return ResponseEntity.ok(dossierService.getDossiers()); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.getDossierById(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DossierCreateRequest req) {
        try { return ResponseEntity.ok(dossierService.createDossier(req)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/ouvrir")
    public ResponseEntity<?> ouvrir(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.ouvrirDossier(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validate(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.validateDossier(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/stamp")
    public ResponseEntity<?> stamp(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.stampDossier(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/seal")
    public ResponseEntity<?> seal(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.sealDossier(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archive(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.archiveDossier(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/security")
    public ResponseEntity<?> setSecurity(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            SecurityLevel level = SecurityLevel.valueOf(body.get("securityLevel"));
            return ResponseEntity.ok(dossierService.setSecurityLevel(id, level));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try { dossierService.deleteDossier(id); return ResponseEntity.noContent().build(); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ── Sync CIRT ──────────────────────────────────────────────────────────

    @PostMapping("/{id}/sync/request")
    public ResponseEntity<?> requestSync(@PathVariable Long id) {
        try { return ResponseEntity.ok(dossierService.requestSync(id)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/sync/requests")
    public ResponseEntity<?> syncRequests() {
        try { return ResponseEntity.ok(dossierService.getSyncRequests()); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/sync/requests/{reqId}/review")
    public ResponseEntity<?> reviewSync(@PathVariable Long reqId, @RequestBody Map<String, Object> body) {
        try {
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String motif = (String) body.get("motif");
            return ResponseEntity.ok(dossierService.reviewSync(reqId, approved, motif));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/by-categories")
    public ResponseEntity<?> byCategories(@RequestParam(required = false) List<Long> categoryId) {
        try {
            List<com.sync.Antic.entity.Dossier> all = dossierService.getDossiers();
            if (categoryId == null || categoryId.isEmpty()) return ResponseEntity.ok(all);
            java.util.Set<Long> catSet = new java.util.HashSet<>(categoryId);
            return ResponseEntity.ok(all.stream()
                .filter(d -> d.getCategory() != null && catSet.contains(d.getCategory().getId()))
                .collect(java.util.stream.Collectors.toList()));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }
}
