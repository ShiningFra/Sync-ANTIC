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
@Table(name = "antennes")
public class Antenne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private LocalDateTime createdAt = LocalDateTime.now();
}
