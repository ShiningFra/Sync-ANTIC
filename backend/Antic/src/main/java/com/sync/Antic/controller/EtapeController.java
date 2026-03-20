/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.entity.Etape;
import com.sync.Antic.service.EtapeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/etapes")
public class EtapeController {

    @Autowired
    private EtapeService etapeService;

    // ➕ Ajouter une étape
    @PostMapping("/{dossierId}")
    public Etape create(@PathVariable Long dossierId,
                        @RequestBody Etape etape) {

        return etapeService.createEtape(dossierId, etape);
    }

    // 📄 Voir les étapes d’un dossier
    @GetMapping("/dossier/{dossierId}")
    public List<Etape> getByDossier(@PathVariable Long dossierId) {
        return etapeService.getEtapesByDossier(dossierId);
    }
}
