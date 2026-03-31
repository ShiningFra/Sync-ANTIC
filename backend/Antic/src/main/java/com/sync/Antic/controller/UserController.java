package com.sync.Antic.controller;

import com.sync.Antic.entity.User;
import com.sync.Antic.repository.UserRepository;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.UserService;
import com.sync.Antic.service.UserService.UserCreateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired private UserService      userService;
    @Autowired private UserRepository   userRepo;
    @Autowired private PasswordEncoder  passwordEncoder;

    /** Utilisateur connecté */
    @GetMapping("/me")
    public User getCurrentUser() {
        return SecurityUtils.getCurrentUserDetails().getUser();
    }

    /** Mettre à jour son propre profil (nom, email, password) */
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();

        // Email : vérifier unicité si changé
        String newEmail = body.get("email");
        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(current.getEmail())) {
            if (userRepo.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cet email est déjà utilisé par un autre compte"));
            }
            current.setEmail(newEmail);
        }

        String newName = body.get("name");
        if (newName != null && !newName.isBlank()) {
            current.setName(newName);
        }

        String newPassword = body.get("password");
        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Le mot de passe doit contenir au moins 6 caractères"));
            }
            current.setPassword(passwordEncoder.encode(newPassword));
        }

        return ResponseEntity.ok(userRepo.save(current));
    }

    /** Liste des utilisateurs (filtrée selon le rôle) */
    @GetMapping
    public List<User> listUsers() {
        return userService.listUsers();
    }

    /** Créer un utilisateur */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserCreateRequest req) {
        try {
            return ResponseEntity.ok(userService.createUser(req));
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
