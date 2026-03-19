/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.sync.Antic.repository;

/**
 *
 * @author berna
 */
import com.sync.Antic.entity.Etape;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EtapeRepository extends JpaRepository<Etape, Long> {

    List<Etape> findByDossierId(Long dossierId);
}
