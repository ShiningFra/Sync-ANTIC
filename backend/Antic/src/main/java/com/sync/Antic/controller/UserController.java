/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.entity.User;
import com.sync.Antic.entity.UserSafeDTO;
import com.sync.Antic.repository.UserRepository;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.UserService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @GetMapping("/me")
    public User getCurrentUser() {
        return SecurityUtils.getCurrentUserDetails().getUser();
    }

    @GetMapping
    public List<User> getAll() {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        String role = current.getRole().getName();

        if (role.equals("super_admin") || role.equals("admin_cirt")) {
            return userRepository.findAll();
        }
        if (role.equals("directeur_antenne") && current.getAntenne() != null) {
            return userRepository.findByAntenneId(current.getAntenne().getId());
        }
        return List.of(current);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        String role = current.getRole().getName();

        User target = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // super_admin peut tout supprimer sauf lui-même
        if (role.equals("super_admin")) {
            if (target.getId().equals(current.getId())) {
                throw new RuntimeException("Impossible de supprimer son propre compte");
            }
            userRepository.deleteById(id);
            return;
        }

        // admin_cirt peut supprimer les agents
        if (role.equals("admin_cirt") && target.getRole().getName().equals("agent")) {
            userRepository.deleteById(id);
            return;
        }

        // directeur_antenne peut supprimer les agents de son antenne
        if (role.equals("directeur_antenne")
                && target.getRole().getName().equals("agent")
                && current.getAntenne() != null
                && current.getAntenne().getId().equals(
                        target.getAntenne() != null ? target.getAntenne().getId() : null)) {
            userRepository.deleteById(id);
            return;
        }

        throw new RuntimeException("Unauthorized");
    }
}
