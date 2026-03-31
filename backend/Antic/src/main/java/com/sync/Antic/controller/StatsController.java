package com.sync.Antic.controller;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Statistiques — Fonctionnalité centrale (CDC §9)
 *
 * Accès :
 *   super_admin / admin_cirt / chef_service  → stats globales + par antenne + par catégorie
 *   directeur_antenne                        → stats de son antenne uniquement
 *   agent_*                                  → pas d'accès aux stats
 */
@RestController
@RequestMapping("/stats")
public class StatsController {

    @Autowired private DossierRepository   dossierRepo;
    @Autowired private AntenneRepository   antenneRepo;
    @Autowired private CategoryRepository  categoryRepo;

    /**
     * Indicateurs globaux par catégorie (CDC §9.1)
     */
    @GetMapping("/global")
    public ResponseEntity<?> globalStats(
            @RequestParam(required = false) String annee,
            @RequestParam(required = false) String mois) {

        User u = SecurityUtils.getCurrentUserDetails().getUser();

        if (u.isAgentAntenne() || u.isAgentCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès aux statistiques non autorisé"));
        }

        List<Category> categories = categoryRepo.findAll();
        List<Antenne> antennes = antenneRepo.findAll();

        List<Dossier> allDossiers = filterByPeriod(dossierRepo.findAll(), annee, mois);

        // Si directeur antenne → restreindre à son antenne
        if (u.isDirecteurAntenne() && u.getAntenne() != null) {
            Long antenneId = u.getAntenne().getId();
            allDossiers = allDossiers.stream()
                .filter(d -> d.getAntenne() != null && d.getAntenne().getId().equals(antenneId))
                .collect(Collectors.toList());
        }

        // Si chef_service → restreindre aux catégories de son service
        final List<Dossier> dossiers = allDossiers;

        List<Map<String, Object>> result = categories.stream().map(cat -> {
            List<Dossier> catDossiers = dossiers.stream()
                .filter(d -> d.getCategory() != null && d.getCategory().getId().equals(cat.getId()))
                .collect(Collectors.toList());

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("categoryId", cat.getId());
            stats.put("categoryName", cat.getName());
            stats.put("total", catDossiers.size());
            stats.put("enCours", catDossiers.stream().filter(d -> d.getStatus() == Status.EN_COURS).count());
            stats.put("valides", catDossiers.stream().filter(d -> d.getStatus() == Status.VALIDE).count());
            stats.put("archives", catDossiers.stream().filter(d -> d.getStatus() == Status.ARCHIVE).count());
            return stats;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Statistiques par antenne (CDC §9.2)
     */
    @GetMapping("/antennes")
    public ResponseEntity<?> statsByAntenne(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String annee,
            @RequestParam(required = false) String mois) {

        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (u.isAgentAntenne() || u.isAgentCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }

        List<Antenne> antennes = antenneRepo.findAll();
        if (u.isDirecteurAntenne() && u.getAntenne() != null) {
            antennes = antennes.stream()
                .filter(a -> a.getId().equals(u.getAntenne().getId()))
                .collect(Collectors.toList());
        }

        List<Dossier> allDossiers = filterByPeriod(dossierRepo.findAll(), annee, mois);
        if (categoryId != null) {
            allDossiers = allDossiers.stream()
                .filter(d -> d.getCategory() != null && d.getCategory().getId().equals(categoryId))
                .collect(Collectors.toList());
        }

        final List<Dossier> dossiers = allDossiers;
        List<Map<String, Object>> result = antennes.stream().map(ant -> {
            List<Dossier> antDossiers = dossiers.stream()
                .filter(d -> d.getAntenne() != null && d.getAntenne().getId().equals(ant.getId()))
                .collect(Collectors.toList());

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("antenneId", ant.getId());
            stats.put("antenneName", ant.getName());
            stats.put("total", antDossiers.size());
            stats.put("enCours", antDossiers.stream().filter(d -> d.getStatus() == Status.EN_COURS).count());
            stats.put("valides", antDossiers.stream().filter(d -> d.getStatus() == Status.VALIDE).count());
            stats.put("archives", antDossiers.stream().filter(d -> d.getStatus() == Status.ARCHIVE).count());
            return stats;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private List<Dossier> filterByPeriod(List<Dossier> dossiers, String annee, String mois) {
        return dossiers.stream().filter(d -> {
            if (d.getCreatedAt() == null) return true;
            if (annee != null && !annee.isEmpty()) {
                try {
                    if (d.getCreatedAt().getYear() != Integer.parseInt(annee)) return false;
                } catch (NumberFormatException ignored) {}
            }
            if (mois != null && !mois.isEmpty()) {
                try {
                    if (d.getCreatedAt().getMonthValue() != Integer.parseInt(mois)) return false;
                } catch (NumberFormatException ignored) {}
            }
            return true;
        }).collect(Collectors.toList());
    }
}
