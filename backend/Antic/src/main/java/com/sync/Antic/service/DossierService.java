/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.DossierRepository;
import com.sync.Antic.security.SecurityUtils;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
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
    
    public List<Dossier> filterDossiers(Long antenneId,
                                    Long categoryId,
                                    Status status,
                                    LocalDateTime start,
                                    LocalDateTime end) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        Specification<Dossier> spec = Specification
                .where(DossierSpecification.hasAntenne(antenneId))
                .and(DossierSpecification.hasCategory(categoryId))
                .and(DossierSpecification.hasStatus(status))
                .and(DossierSpecification.createdAfter(start))
                .and(DossierSpecification.createdBefore(end));
    
        // 🔐 Appliquer sécurité
        spec = spec.and(applySecurityFilter(user));

        return dossierRepository.findAll(spec);
    }
    
    private Specification<Dossier> applySecurityFilter(User user) {

        String role = user.getRole().getName();

        return (root, query, cb) -> {

            if (role.equals("super_admin") || role.equals("admin_cirt")) {
                return cb.conjunction();
            }

            if (role.equals("directeur_antenne")) {
                return cb.equal(root.get("antenne").get("id"),
                                user.getAntenne().getId());
            }

            return cb.equal(root.get("createdBy").get("id"),
                            user.getId());
        };
    }
    
    public Map<Long, Map<Status, Long>> getStats(Long categoryId) {

        List<StatsProjection> data =
                dossierRepository.getStatsByCategory(categoryId);

        Map<Long, Map<Status, Long>> result = new HashMap<>();

        for (StatsProjection row : data) {

            result
                .computeIfAbsent(row.getAntenneId(), k -> new HashMap<>())
                .put(Status.valueOf(row.getStatus()), row.getCount());
        }

        return result;
    }
    
    public Page<Dossier> getDossiers(Pageable pageable) {
        return dossierRepository.findAll(pageable);
    }
}
