/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.DossierRepository;
import com.sync.Antic.security.SecurityUtils;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class DossierService {

    @Autowired
    private DossierRepository dossierRepository;

    public List<Dossier> getAccessibleDossiers() {

        User user = SecurityUtils.getCurrentUserDetails().getUser();
        String role = user.getRole().getName();

        // 🔥 SUPER ADMIN / ADMIN CIRT
        if (role.equals("super_admin") || role.equals("admin_cirt")) {
            return dossierRepository.findAll();
        }

        // 🔥 DIRECTEUR ANTENNE
        if (role.equals("directeur_antenne")) {
            return dossierRepository.findByAntenneId(user.getAntenne().getId());
        }

        // 🔥 AGENT
        if (role.equals("agent")) {
            return dossierRepository.findByCreatedById(user.getId());
        }

        return List.of();
    }
    
    public Dossier createDossier(Dossier dossier) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        // 🔒 seuls agents et directeurs antenne
        if (user.getRole().getName().equals("admin_cirt") ||
            user.getRole().getName().equals("super_admin")) {
            throw new RuntimeException("CIRT cannot create dossiers");
        }

        dossier.setCreatedBy(user);
        dossier.setAntenne(user.getAntenne());

        return dossierRepository.save(dossier);
    }
    
    public Dossier validateDossier(Long id) {

       User user = SecurityUtils.getCurrentUserDetails().getUser();

        if (!user.getRole().getName().contains("cirt")) {
            throw new RuntimeException("Only CIRT can validate");
        }

        Dossier d = dossierRepository.findById(id)
                .orElseThrow();

        d.setStatus(Status.VALIDE);
        d.setValidatedAt(LocalDateTime.now());

        return dossierRepository.save(d);
    }
    
    public Dossier archiveDossier(Long id) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        if (!user.getRole().getName().contains("cirt")) {
            throw new RuntimeException("Only CIRT can archive");
        }

        Dossier d = dossierRepository.findById(id)
                .orElseThrow();

        if (d.getStatus() != Status.VALIDE) {
            throw new RuntimeException("Only validated dossiers can be archived");
        }

        d.setStatus(Status.ARCHIVE);

        return dossierRepository.save(d);
    }
}
