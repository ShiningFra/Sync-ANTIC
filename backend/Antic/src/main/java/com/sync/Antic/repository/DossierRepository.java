/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.sync.Antic.repository;

import com.sync.Antic.model.*;
import java.awt.print.Pageable;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author berna
 */
public interface DossierRepository extends JpaRepository<Dossier,Long>{

    List<Dossier> findByStatus(Status status);

    List<Dossier> findByCategoryId(Long id);
    
    Page<Dossier> findByStatus(Status status, Pageable pageable);

}
