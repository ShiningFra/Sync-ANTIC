package com.sync.Antic.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Hiérarchie des rôles :
 *
 *   super_admin        → Rôle technique suprême. Peut créer un directeur.
 *                        N'est pas le directeur lui-même.
 *   directeur          → Directeur CIRT. Créé par le super_admin.
 *                        Un seul directeur actif à la fois (les autres sont désactivés).
 *                        Peut créer : admin_cirt (sous-directeurs) + directeur_antenne.
 *                        Peut apposer tampon et sceau final sur les dossiers.
 *   admin_cirt         → Sous-directeur CIRT. Créé par directeur ou super_admin.
 *                        À sa création, une sous-direction lui est créée ou assignée.
 *                        Peut créer : chef_service, agent_cirt (dans sa sous-direction).
 *   chef_service       → Chef de service. Créé par admin_cirt.
 *   directeur_antenne  → Directeur d'antenne. Créé par le directeur UNIQUEMENT.
 *                        Un seul actif par antenne (les précédents sont désactivés).
 *   agent_cirt         → Agent CIRT. Créé par admin_cirt.
 *   agent_antenne      → Agent d'antenne. Créé par directeur_antenne.
 *
 * Héritage des permissions : les supérieurs voient tout ce que leurs subordonnés voient.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "antenne_id")
    private Antenne antenne;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id")
    private ServiceCirt service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnore
    private User createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean active = true;

    // ── Getters / Setters ──────────────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Antenne getAntenne() { return antenne; }
    public void setAntenne(Antenne antenne) { this.antenne = antenne; }
    public ServiceCirt getService() { return service; }
    public void setService(ServiceCirt service) { this.service = service; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    // ── Helpers rôle ───────────────────────────────────────────────────────
    public String getRoleName() { return role != null ? role.getName() : null; }

    /** Rôle technique suprême — au-dessus du directeur */
    public boolean isSuperAdmin() { return "super_admin".equals(getRoleName()); }

    /** Directeur CIRT — créé par super_admin, un seul actif à la fois */
    public boolean isDirecteur() { return "directeur".equals(getRoleName()); }

    /** Sous-directeur CIRT — créé par directeur ou super_admin */
    public boolean isAdminCirt() { return "admin_cirt".equals(getRoleName()); }

    /** Chef de service — créé par admin_cirt */
    public boolean isChefService() { return "chef_service".equals(getRoleName()); }

    /** Directeur d'antenne — créé par le directeur uniquement */
    public boolean isDirecteurAntenne() { return "directeur_antenne".equals(getRoleName()); }

    /** Agent CIRT — créé par admin_cirt */
    public boolean isAgentCirt() { return "agent_cirt".equals(getRoleName()); }

    /** Agent d'antenne — créé par directeur_antenne */
    public boolean isAgentAntenne() { return "agent_antenne".equals(getRoleName()); }

    /**
     * Vrai si l'utilisateur est un membre de la direction CIRT centrale.
     * super_admin et directeur ont tous les droits CIRT + plus.
     */
    public boolean isCirtMember() {
        String r = getRoleName();
        return "super_admin".equals(r) || "directeur".equals(r)
            || "admin_cirt".equals(r) || "chef_service".equals(r) || "agent_cirt".equals(r);
    }

    /** Vrai si l'utilisateur appartient à une antenne */
    public boolean isAntenneMember() {
        String r = getRoleName();
        return "directeur_antenne".equals(r) || "agent_antenne".equals(r);
    }

    /**
     * Vrai si l'utilisateur est un supérieur hiérarchique avec accès total CIRT.
     * super_admin et directeur voient tout sans restriction catégorie.
     */
    public boolean isTopLevel() {
        String r = getRoleName();
        return "super_admin".equals(r) || "directeur".equals(r);
    }
}
