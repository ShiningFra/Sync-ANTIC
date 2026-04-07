package com.sync.Antic.controller;

import com.sync.Antic.entity.ActivityLog;
import com.sync.Antic.entity.User;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * API des journaux d'activité.
 * Accessible :
 *   - super_admin : tous les logs
 *   - admin_cirt  : tous les logs
 *   - autres      : uniquement leurs propres logs
 */
@RestController
@RequestMapping("/logs")
public class LogController {

    @Autowired private ActivityLogService logService;

    /** Tous les logs (super_admin / admin_cirt uniquement) */
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        try {
            List<ActivityLog> logs = (from != null && to != null)
                ? logService.getByDateRange(from, to)
                : logService.getAll();
            return ResponseEntity.ok(logs);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Logs d'un utilisateur spécifique */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUser(
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        // Peut voir ses propres logs, ou un supérieur peut voir ceux de n'importe qui
        if (!u.isSuperAdmin() && !u.isAdminCirt() && !u.getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        try {
            List<ActivityLog> logs = (from != null && to != null)
                ? logService.getByActorAndDateRange(userId, from, to)
                : logService.getByActor(userId);
            return ResponseEntity.ok(logs);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Logs relatifs à une ressource (dossier, utilisateur, antenne…) */
    @GetMapping("/target/{targetType}/{targetId}")
    public ResponseEntity<?> getByTarget(@PathVariable String targetType, @PathVariable Long targetId) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isDirecteur() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        try {
            return ResponseEntity.ok(logService.getByTarget(targetType, targetId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Mes propres logs */
    @GetMapping("/me")
    public ResponseEntity<?> getMyLogs() {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        try {
            return ResponseEntity.ok(logService.getByActor(u.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
