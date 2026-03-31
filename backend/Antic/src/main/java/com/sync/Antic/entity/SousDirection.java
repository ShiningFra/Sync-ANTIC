package com.sync.Antic.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

/**
 * Sous-direction du CIRT.
 * Dirigée par un admin_cirt.
 */
@Entity
@Table(name = "sous_directions")
public class SousDirection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "sousDirection", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ServiceCirt> services;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<ServiceCirt> getServices() { return services; }
    public void setServices(List<ServiceCirt> services) { this.services = services; }
}
