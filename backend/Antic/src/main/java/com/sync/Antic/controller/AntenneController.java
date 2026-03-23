package com.sync.Antic.controller;

import com.sync.Antic.entity.Antenne;
import com.sync.Antic.repository.AntenneRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/antennes")
public class AntenneController {

    @Autowired
    private AntenneRepository antenneRepository;

    @GetMapping
    public List<Antenne> getAll() {
        return antenneRepository.findAll();
    }

    @PostMapping
    public Antenne create(@RequestBody Antenne antenne) {
        return antenneRepository.save(antenne);
    }
}
