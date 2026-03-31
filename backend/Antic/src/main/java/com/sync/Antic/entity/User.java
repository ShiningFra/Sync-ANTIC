package com.sync.Antic.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Rôles disponibles :
 *   super_admin        → Directeur du CIRT
 *   admin_cirt         → Sous-directeurs CIRT
 *   chef_service       → Chef de service CIRT
 *   directeur_antenne  → Directeur d'une antenne
 *   agent_cirt         → Agent CIRT (appartient à un service)
 *   agent_antenne      → Agent d'une antenne
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

    public String getRoleName() { return role != null ? role.getName() : null; }
    public boolean isSuperAdmin() { return "super_admin".equals(getRoleName()); }
    public boolean isAdminCirt() { return "admin_cirt".equals(getRoleName()); }
    public boolean isChefService() { return "chef_service".equals(getRoleName()); }
    public boolean isDirecteurAntenne() { return "directeur_antenne".equals(getRoleName()); }
    public boolean isAgentCirt() { return "agent_cirt".equals(getRoleName()); }
    public boolean isAgentAntenne() { return "agent_antenne".equals(getRoleName()); }
    public boolean isCirtMember() {
        String r = getRoleName();
        return "super_admin".equals(r) || "admin_cirt".equals(r) || "chef_service".equals(r) || "agent_cirt".equals(r);
    }
    public boolean isAntenneMember() {
        String r = getRoleName();
        return "directeur_antenne".equals(r) || "agent_antenne".equals(r);
    }
}
