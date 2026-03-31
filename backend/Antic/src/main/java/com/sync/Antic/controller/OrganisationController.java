package com.sync.Antic.controller;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Gestion de la structure organisationnelle CIRT :
 * Sous-directions et Services.
 * Accessible uniquement aux super_admin et admin_cirt.
 */
@RestController
@RequestMapping("/organisation")
public class OrganisationController {

    @Autowired private SousDirectionRepository sdRepo;
    @Autowired private ServiceCirtRepository   svcRepo;

    // ── Sous-directions ────────────────────────────────────────────────────

    @GetMapping("/sous-directions")
    public List<SousDirection> listSousDirections() {
        return sdRepo.findAll();
    }

    @PostMapping("/sous-directions")
    public ResponseEntity<?> createSousDirection(@RequestBody Map<String, String> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        SousDirection sd = new SousDirection();
        sd.setName(body.get("name"));
        return ResponseEntity.ok(sdRepo.save(sd));
    }

    @DeleteMapping("/sous-directions/{id}")
    public ResponseEntity<?> deleteSousDirection(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur peut supprimer une sous-direction"));
        }
        sdRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Services ───────────────────────────────────────────────────────────

    @GetMapping("/services")
    public List<ServiceCirt> listServices() {
        return svcRepo.findAll();
    }

    @GetMapping("/sous-directions/{sdId}/services")
    public List<ServiceCirt> listServicesBySousDirection(@PathVariable Long sdId) {
        return svcRepo.findBySousDirectionId(sdId);
    }

    @PostMapping("/services")
    public ResponseEntity<?> createService(@RequestBody ServiceCreateRequest req) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        SousDirection sd = sdRepo.findById(req.getSousDirectionId())
            .orElseThrow(() -> new RuntimeException("Sous-direction introuvable"));
        ServiceCirt svc = new ServiceCirt();
        svc.setName(req.getName());
        svc.setDescription(req.getDescription());
        svc.setSousDirection(sd);
        return ResponseEntity.ok(svcRepo.save(svc));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        svcRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    static class ServiceCreateRequest {
        private String name;
        private String description;
        private Long sousDirectionId;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Long getSousDirectionId() { return sousDirectionId; }
        public void setSousDirectionId(Long sousDirectionId) { this.sousDirectionId = sousDirectionId; }
    }
}
