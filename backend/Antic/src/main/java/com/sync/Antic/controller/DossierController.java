/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.entity.Dossier;
import com.sync.Antic.service.DossierService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/dossiers")
public class DossierController {

    @Autowired
    private DossierService dossierService;

    // 🔍 voir dossiers accessibles
    @GetMapping
    public List<Dossier> getDossiers() {
        return dossierService.getAccessibleDossiers();
    }

    // ➕ créer
    @PostMapping
    public Dossier create(@RequestBody Dossier dossier) {
        return dossierService.createDossier(dossier);
    }

    // ✅ valider
    @PutMapping("/{id}/validate")
    public Dossier validate(@PathVariable Long id) {
        return dossierService.validateDossier(id);
    }

    // 📦 archiver
    @PutMapping("/{id}/archive")
    public Dossier archive(@PathVariable Long id) {
        return dossierService.archiveDossier(id);
    }
}
