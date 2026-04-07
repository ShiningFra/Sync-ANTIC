package com.sync.Antic.entity;

import jakarta.persistence.*;

/**
 * Affiliation d'une catégorie à une antenne.
 * Permet de configurer quelles catégories sont disponibles dans quelle antenne.
 * Configurable par le directeur (super_admin) ou les admin_cirt.
 */
@Entity
@Table(name = "antenne_categories",
       uniqueConstraints = @UniqueConstraint(columnNames = {"antenne_id", "category_id"}))
public class AntenneCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "antenne_id", nullable = false)
    private Antenne antenne;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Antenne getAntenne() { return antenne; }
    public void setAntenne(Antenne antenne) { this.antenne = antenne; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
}
