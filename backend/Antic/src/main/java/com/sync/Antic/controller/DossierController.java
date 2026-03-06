/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.model.Dossier;
import com.sync.Antic.model.Status;
import com.sync.Antic.repository.DossierRepository;
import com.sync.Antic.service.DossierService;
import java.awt.print.Pageable;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/dossiers")
public class DossierController {

    private final DossierService service;
    private final DossierRepository repository;

    public DossierController(DossierService service, DossierRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @GetMapping("/pending")
public Page<Dossier> pending(Pageable pageable){

return repository.findByStatus(Status.PENDING,pageable);

}

    @GetMapping("/validated")
    public List<Dossier> validated(){

        return service.getValidated();

    }

    @PutMapping("/{id}/validate")
    public Dossier validate(@PathVariable Long id){

        return service.validate(id);

    }

}
