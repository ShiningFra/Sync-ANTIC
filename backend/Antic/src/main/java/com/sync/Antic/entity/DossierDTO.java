package com.sync.Antic.entity;

/**
 * DTO léger pour les réponses simplifiées.
 */
public class DossierDTO {
    private Long id;
    private String title;
    private String status;
    private String categoryName;
    private String antenneName;
    private String createdAt;

    public DossierDTO() {}

    public DossierDTO(Dossier d) {
        this.id = d.getId();
        this.title = d.getTitle();
        this.status = d.getStatus() != null ? d.getStatus().name() : null;
        this.categoryName = d.getCategory() != null ? d.getCategory().getName() : null;
        this.antenneName = d.getAntenne() != null ? d.getAntenne().getName() : null;
        this.createdAt = d.getCreatedAt() != null ? d.getCreatedAt().toString() : null;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getStatus() { return status; }
    public String getCategoryName() { return categoryName; }
    public String getAntenneName() { return antenneName; }
    public String getCreatedAt() { return createdAt; }
}
