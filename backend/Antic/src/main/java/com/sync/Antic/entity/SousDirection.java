package com.sync.Antic.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Sous-direction du CIRT.
 * Chaque sous-direction est dirigée par UN admin_cirt (sous-directeur).
 * À la création d'un sous-directeur, une nouvelle sous-direction est créée
 * ou une sous-direction vide lui est affectée.
 */
@Entity
@Table(name = "sous_directions")
public class SousDirection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** Le sous-directeur qui dirige cette sous-direction */
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "directeur_id")
    private User directeur;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "sousDirection", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ServiceCirt> services;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public User getDirecteur() { return directeur; }
    public void setDirecteur(User directeur) { this.directeur = directeur; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<ServiceCirt> getServices() { return services; }
    public void setServices(List<ServiceCirt> services) { this.services = services; }
}
