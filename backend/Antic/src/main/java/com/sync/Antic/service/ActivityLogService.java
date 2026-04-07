package com.sync.Antic.service;

import com.sync.Antic.entity.ActivityLog;
import com.sync.Antic.entity.ActivityLog.ActionType;
import com.sync.Antic.entity.User;
import com.sync.Antic.repository.ActivityLogRepository;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service de journalisation des activités.
 * Appelé depuis les services métier après chaque action significative.
 * JAMAIS de mot de passe (ni en clair, ni hashé) dans les logs.
 */
@Service
public class ActivityLogService {

    @Autowired private ActivityLogRepository logRepo;

    /**
     * Enregistre une entrée de log.
     *
     * @param actor       L'utilisateur qui effectue l'action (peut être null lors du démarrage)
     * @param action      Le type d'action
     * @param targetType  Type de la ressource ("User", "Dossier", "Antenne", "Category", …)
     * @param targetId    ID de la ressource (null si pas applicable)
     * @param targetLabel Libellé lisible de la ressource (nom, titre…)
     * @param description Description textuelle de l'événement
     */
    public ActivityLog log(User actor, ActionType action,
                           String targetType, Long targetId,
                           String targetLabel, String description) {
        ActivityLog entry = new ActivityLog();
        entry.setActor(actor);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setTargetLabel(targetLabel);
        entry.setDescription(description);
        entry.setCreatedAt(LocalDateTime.now());
        return logRepo.save(entry);
    }

    /** Surcharge pratique : tente de récupérer l'acteur courant automatiquement */
    public ActivityLog logCurrent(ActionType action,
                                   String targetType, Long targetId,
                                   String targetLabel, String description) {
        User actor = null;
        try {
            actor = SecurityUtils.getCurrentUserDetails().getUser();
        } catch (Exception ignored) { /* pas d'utilisateur authentifié */ }
        return log(actor, action, targetType, targetId, targetLabel, description);
    }

    // ── Lecture ────────────────────────────────────────────────────────────

    public List<ActivityLog> getAll() {
        return logRepo.findAllOrderByCreatedAtDesc();
    }

    public List<ActivityLog> getByActor(Long actorId) {
        return logRepo.findByActorIdOrderByCreatedAtDesc(actorId);
    }

    public List<ActivityLog> getByTarget(String targetType, Long targetId) {
        return logRepo.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
    }

    public List<ActivityLog> getByDateRange(LocalDateTime from, LocalDateTime to) {
        return logRepo.findByDateRange(from, to);
    }

    public List<ActivityLog> getByActorAndDateRange(Long actorId, LocalDateTime from, LocalDateTime to) {
        return logRepo.findByActorAndDateRange(actorId, from, to);
    }
}
