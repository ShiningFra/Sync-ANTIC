/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 *
 * @author berna
 */
@Entity
public class Dossier {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

private String title;

private String description;

@ManyToOne
private Category category;

@ManyToOne
private User createdBy;

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Category getCategory() {
        return category;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public Status getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getValidatedAt() {
        return validatedAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setValidatedAt(LocalDateTime validatedAt) {
        this.validatedAt = validatedAt;
    }

@Enumerated(EnumType.STRING)
private Status status;

private LocalDateTime createdAt;

private LocalDateTime validatedAt;

}