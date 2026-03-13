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
@Table(name="users")
public class User {

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public RoleType getRolet() {
        return rolet;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

@Id
@GeneratedValue(strategy=GenerationType.IDENTITY)
private Long id;

@Column(unique=true)
private String username;

private String password;

@Enumerated(EnumType.STRING)
private RoleType rolet;

@ManyToOne
private Role role;

    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRolet(RoleType rolet) {
        this.rolet = rolet;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Role getRole() {
        return role;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

private LocalDateTime createdAt;

}
