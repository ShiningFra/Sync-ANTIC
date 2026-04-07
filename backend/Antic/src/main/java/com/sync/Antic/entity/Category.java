package com.sync.Antic.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    /**
     * Niveau de sécurité par défaut appliqué aux dossiers de cette catégorie.
     * Configurable par le directeur (super_admin), l'admin_cirt, ou le directeur_antenne.
     * Si un supérieur a configuré ce niveau, un subordonné ne peut pas le modifier.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SecurityLevel securityLevel = SecurityLevel.PUBLIC;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "security_set_by")
    private User securitySetBy;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public SecurityLevel getSecurityLevel() { return securityLevel; }
    public void setSecurityLevel(SecurityLevel securityLevel) { this.securityLevel = securityLevel; }
    public User getSecuritySetBy() { return securitySetBy; }
    public void setSecuritySetBy(User securitySetBy) { this.securitySetBy = securitySetBy; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
