package com.sync.Antic.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Journal d'activité de la plateforme.
 * Toute action significative (changement de poste, permissions, profil, mot de passe,
 * création/suppression d'utilisateur, validation de dossier, etc.) est loggée ici.
 * Les mots de passe (ni en clair ni en hash) ne sont jamais stockés.
 */
@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    public enum ActionType {
        // Authentification
        LOGIN, LOGOUT,
        // Utilisateurs
        USER_CREATED, USER_DELETED, USER_ACTIVATED, USER_DEACTIVATED,
        USER_ROLE_CHANGED, USER_PROFILE_UPDATED, USER_PASSWORD_CHANGED,
        USER_ANTENNE_CHANGED, USER_SERVICE_CHANGED,
        // Organisation
        SOUS_DIRECTION_CREATED, SOUS_DIRECTION_UPDATED, SOUS_DIRECTION_DELETED,
        SERVICE_CREATED, SERVICE_DELETED,
        ANTENNE_CREATED, ANTENNE_DELETED, ANTENNE_CATEGORIES_UPDATED,
        // Catégories & Permissions
        CATEGORY_CREATED, CATEGORY_DELETED,
        PERMISSION_GRANTED, PERMISSION_REVOKED,
        SECURITY_LEVEL_CHANGED,
        // Dossiers
        DOSSIER_CREATED, DOSSIER_OPENED, DOSSIER_VALIDATED, DOSSIER_ARCHIVED,
        DOSSIER_DELETED, DOSSIER_STAMPED, DOSSIER_SEALED,
        DOSSIER_SYNC_REQUESTED, DOSSIER_SYNC_APPROVED, DOSSIER_SYNC_REJECTED,
        // Documents
        DOCUMENT_UPLOADED, DOCUMENT_DELETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Qui a effectué l'action */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType action;

    /** Description textuelle (sans données sensibles) */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** ID de la ressource concernée (userId, dossierId, antenneId…) */
    private Long targetId;

    /** Type de la ressource (User, Dossier, Antenne, Category…) */
    private String targetType;

    /** Nom/libellé de la ressource pour affichage (sans hash/password) */
    private String targetLabel;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Getters / Setters ──────────────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }
    public ActionType getAction() { return action; }
    public void setAction(ActionType action) { this.action = action; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public String getTargetLabel() { return targetLabel; }
    public void setTargetLabel(String targetLabel) { this.targetLabel = targetLabel; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
