package com.sync.Antic.controller;

import com.sync.Antic.entity.Antenne;
import com.sync.Antic.entity.User;
import com.sync.Antic.repository.AntenneRepository;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/antennes")
public class AntenneController {

    @Autowired private AntenneRepository antenneRepo;

    @GetMapping
    public List<Antenne> list() {
        return antenneRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Antenne antenne) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Seuls les admins CIRT peuvent créer des antennes"));
        }
        return ResponseEntity.ok(antenneRepo.save(antenne));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User u = SecurityUtils.getCurrentUserDetails().getUser();
        if (!u.isSuperAdmin() && !u.isAdminCirt()) {
            return ResponseEntity.status(403).body(Map.of("error", "Droits insuffisants"));
        }
        antenneRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
