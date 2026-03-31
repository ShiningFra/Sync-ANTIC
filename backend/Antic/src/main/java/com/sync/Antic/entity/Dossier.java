package com.sync.Antic.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "dossiers")
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "antenne_id", nullable = false)
    private Antenne antenne;

    /** Service CIRT responsable du traitement (optionnel - assigné par CIRT) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id")
    private ServiceCirt service;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "validated_by")
    private User validatedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "archived_by")
    private User archivedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.EN_COURS;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime validatedAt;
    private LocalDateTime archivedAt;

    // Les étapes sont chargées à la demande (lazy) pour éviter les boucles
    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Etape> etapes;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public Antenne getAntenne() { return antenne; }
    public void setAntenne(Antenne antenne) { this.antenne = antenne; }
    public ServiceCirt getService() { return service; }
    public void setService(ServiceCirt service) { this.service = service; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public User getValidatedBy() { return validatedBy; }
    public void setValidatedBy(User validatedBy) { this.validatedBy = validatedBy; }
    public User getArchivedBy() { return archivedBy; }
    public void setArchivedBy(User archivedBy) { this.archivedBy = archivedBy; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
    public List<Etape> getEtapes() { return etapes; }
    public void setEtapes(List<Etape> etapes) { this.etapes = etapes; }
}
