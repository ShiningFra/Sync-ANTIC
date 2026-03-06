/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.model.Dossier;
import com.sync.Antic.service.DossierService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/annexe")
public class AnnexeController {

    private final DossierService dossierService;

    public AnnexeController(DossierService dossierService) {
        this.dossierService = dossierService;
    }

    @PostMapping("/dossier")
    public Dossier createDossier(@RequestBody Dossier dossier){

        return dossierService.create(dossier);

    }

}