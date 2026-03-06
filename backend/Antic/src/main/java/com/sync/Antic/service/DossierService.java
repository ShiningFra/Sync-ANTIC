/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

/**
 *
 * @author berna
 */
import com.sync.Antic.model.Dossier;
import com.sync.Antic.model.Status;
import com.sync.Antic.repository.DossierRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DossierService {

    private final DossierRepository repository;

    public DossierService(DossierRepository repository) {
        this.repository = repository;
    }

    public Dossier create(Dossier dossier){

        dossier.setStatus(Status.PENDING);
        dossier.setCreatedAt(LocalDateTime.now());

        return repository.save(dossier);
    }

    public List<Dossier> getPending(){

        return repository.findByStatus(Status.PENDING);

    }

    public List<Dossier> getValidated(){

        return repository.findByStatus(Status.VALIDATED);

    }

    public Dossier validate(Long id){

        Dossier dossier = repository.findById(id)
                .orElseThrow();

        dossier.setStatus(Status.VALIDATED);

        dossier.setValidatedAt(LocalDateTime.now());

        return repository.save(dossier);

    }

}
