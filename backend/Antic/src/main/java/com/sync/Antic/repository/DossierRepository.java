/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.sync.Antic.repository;

/**
 *
 * @author berna
 */
import com.sync.Antic.entity.*;
import org.springframework.data.jpa.repository.*;

import java.util.List;

public interface DossierRepository extends JpaRepository<Dossier, Long>,
        JpaSpecificationExecutor<Dossier> {

    // Tous les dossiers d'une antenne
    List<Dossier> findByAntenneId(Long antenneId);

    // Dossiers créés par un utilisateur
    List<Dossier> findByCreatedById(Long userId);

    // Filtrage par catégorie
    List<Dossier> findByCategoryId(Long categoryId);

    // Filtrage par status
    List<Dossier> findByStatus(Status status);

    // Combo (ex: antenne + status)
    List<Dossier> findByAntenneIdAndStatus(Long antenneId, Status status);
}
