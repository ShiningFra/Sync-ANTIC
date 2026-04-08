package com.sync.Antic.controller;

import com.sync.Antic.entity.*;
import com.sync.Antic.entity.ActivityLog.ActionType;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/organisation")
public class OrganisationController {

    @Autowired private SousDirectionRepository sdRepo;
    @Autowired private ServiceCirtRepository   svcRepo;
    @Autowired private ActivityLogService      activityLogService;

    // ── Sous-directions ────────────────────────────────────────────────────

    @GetMapping("/sous-directions")
    public List<SousDirection> listSousDirections() {
        return sdRepo.findAll();
    }

    /** Sous-directions sans directeur actif (pour assignation à un nouveau sous-directeur) */
    @GetMapping("/sous-directions/libres")
    public ResponseEntity<?> listLibres() {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        List<SousDirection> libres = sdRepo.findAll().stream()
            .filter(sd -> sd.getDirecteur() == null || !sd.getDirecteur().isActive())
            .collect(Collectors.toList());
        return ResponseEntity.ok(libres);
    }

    /**
     * Créer une sous-direction manuellement.
     * Normalement créée automatiquement à la création d'un admin_cirt.
     * Accessible : directeur ou super_admin.
     */
    @PostMapping("/sous-directions")
    public ResponseEntity<?> createSousDirection(@RequestBody Map<String, String> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur CIRT peut créer une sous-direction"));
        }
        SousDirection sd = new SousDirection();
        sd.setName(body.get("name"));
        SousDirection saved = sdRepo.save(sd);
        activityLogService.log(u, ActionType.SOUS_DIRECTION_CREATED,
            "SousDirection", saved.getId(), saved.getName(),
            "Création de la sous-direction '" + saved.getName() + "'");
        return ResponseEntity.ok(saved);
    }

    /**
     * Modifier une sous-direction.
     * Accessible : directeur, super_admin, ou l'admin_cirt responsable.
     */
    @PutMapping("/sous-directions/{id}")
    public ResponseEntity<?> updateSousDirection(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        SousDirection sd = sdRepo.findById(id).orElseThrow(() -> new RuntimeException("Sous-direction introuvable"));

        // admin_cirt peut modifier uniquement sa propre sous-direction
        if (u.isAdminCirt()) {
            if (sd.getDirecteur() == null || !sd.getDirecteur().getId().equals(u.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez modifier que votre propre sous-direction"));
            }
        } else if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }

        String old = sd.getName();
        sd.setName(body.get("name"));
        SousDirection saved = sdRepo.save(sd);
        activityLogService.log(u, ActionType.SOUS_DIRECTION_UPDATED,
            "SousDirection", saved.getId(), saved.getName(),
            "Modification sous-direction : '" + old + "' → '" + saved.getName() + "'");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/sous-directions/{id}")
    public ResponseEntity<?> deleteSousDirection(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul le directeur peut supprimer une sous-direction"));
        }
        SousDirection sd = sdRepo.findById(id).orElse(null);
        sdRepo.deleteById(id);
        activityLogService.log(u, ActionType.SOUS_DIRECTION_DELETED,
            "SousDirection", id, sd != null ? sd.getName() : String.valueOf(id),
            "Suppression de la sous-direction '" + (sd != null ? sd.getName() : id) + "'");
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

    /**
     * Créer un service dans une sous-direction.
     * Accessible : directeur, super_admin, ou l'admin_cirt de la sous-direction.
     */
    @PostMapping("/services")
    public ResponseEntity<?> createService(@RequestBody ServiceCreateRequest req) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        SousDirection sd = sdRepo.findById(req.getSousDirectionId())
            .orElseThrow(() -> new RuntimeException("Sous-direction introuvable"));

        // admin_cirt ne peut créer des services que dans sa propre sous-direction
        if (u.isAdminCirt()) {
            if (sd.getDirecteur() == null || !sd.getDirecteur().getId().equals(u.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Vous ne pouvez créer des services que dans votre sous-direction"));
            }
        }

        ServiceCirt svc = new ServiceCirt();
        svc.setName(req.getName());
        svc.setDescription(req.getDescription());
        svc.setSousDirection(sd);
        ServiceCirt saved = svcRepo.save(svc);
        activityLogService.log(u, ActionType.SERVICE_CREATED,
            "ServiceCirt", saved.getId(), saved.getName(),
            "Création du service '" + saved.getName() + "' dans sous-direction '" + sd.getName() + "'");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        ServiceCirt svc = svcRepo.findById(id).orElse(null);
        if (u.isAdminCirt() && svc != null && svc.getSousDirection() != null) {
            SousDirection mySD = svc.getSousDirection();
            if (mySD.getDirecteur() == null || !mySD.getDirecteur().getId().equals(u.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Ce service n'appartient pas à votre sous-direction"));
            }
        }
        svcRepo.deleteById(id);
        activityLogService.log(u, ActionType.SERVICE_DELETED,
            "ServiceCirt", id, svc != null ? svc.getName() : String.valueOf(id),
            "Suppression du service '" + (svc != null ? svc.getName() : id) + "'");
        return ResponseEntity.noContent().build();
    }

    static class ServiceCreateRequest {
        private String name, description;
        private Long sousDirectionId;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Long getSousDirectionId() { return sousDirectionId; }
        public void setSousDirectionId(Long sousDirectionId) { this.sousDirectionId = sousDirectionId; }
    }
}
