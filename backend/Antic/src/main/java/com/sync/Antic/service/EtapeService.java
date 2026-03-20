/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class EtapeService {

    @Autowired
    private EtapeRepository etapeRepository;

    @Autowired
    private DossierRepository dossierRepository;

    public Etape createEtape(Long dossierId, Etape etape) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier not found"));

        // 🔐 Vérification accès
        if (!canAccessDossier(user, dossier)) {
            throw new RuntimeException("Unauthorized");
        }

        etape.setDossier(dossier);
        etape.setCreatedBy(user);

        return etapeRepository.save(etape);
    }
    
        private boolean canAccessDossier(User user, Dossier dossier) {

        String role = user.getRole().getName();

        // CIRT → accès total
        if (role.equals("super_admin") || role.equals("admin_cirt")) {
            return true;
        }

        // Directeur antenne → son antenne
        if (role.equals("directeur_antenne")) {
            return dossier.getAntenne().getId().equals(user.getAntenne().getId());
        }

        // Agent → seulement ses dossiers
        if (role.equals("agent")) {
            return dossier.getCreatedBy().getId().equals(user.getId());
        }

        return false;
    }
        
    public List<Etape> getEtapesByDossier(Long dossierId) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow();

        if (!canAccessDossier(user, dossier)) {
            throw new RuntimeException("Unauthorized");
        }

        return etapeRepository.findByDossierId(dossierId);
    }
}