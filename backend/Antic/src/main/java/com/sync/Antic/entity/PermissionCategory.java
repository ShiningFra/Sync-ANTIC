package com.sync.Antic.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * Associe un utilisateur CIRT à une catégorie.
 * Les superviseurs CIRT ne voient que les dossiers de leurs catégories assignées.
 * Géré par les admin_cirt.
 */
@Entity
@Table(name = "permissions_category",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_id"}))
public class PermissionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
}
