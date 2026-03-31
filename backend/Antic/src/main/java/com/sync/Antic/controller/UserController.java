package com.sync.Antic.controller;

import com.sync.Antic.entity.User;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.UserService;
import com.sync.Antic.service.UserService.UserCreateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired private UserService userService;

    /** Récupérer l'utilisateur connecté */
    @GetMapping("/me")
    public User getCurrentUser() {
        return SecurityUtils.getCurrentUserDetails().getUser();
    }

    /** Lister les utilisateurs (filtré selon le rôle de l'appelant) */
    @GetMapping
    public List<User> listUsers() {
        return userService.listUsers();
    }

    /** Créer un utilisateur */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserCreateRequest req) {
        try {
            User created = userService.createUser(req);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Supprimer un utilisateur */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
