package com.sync.Antic.controller;

import com.sync.Antic.entity.User;
import com.sync.Antic.repository.UserRepository;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.UserService;
import com.sync.Antic.service.UserService.UserCreateRequest;
import com.sync.Antic.service.UserService.UserRoleUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired private UserService     userService;
    @Autowired private UserRepository  userRepo;

    @GetMapping("/me")
    public User getCurrentUser() {
        return SecurityUtils.getCurrentUserDetails().getUser();
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        User current = SecurityUtils.getCurrentUserDetails().getUser();
        String newEmail = body.get("email");
        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(current.getEmail())) {
            if (userRepo.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé"));
            }
        }
        String newPassword = body.get("password");
        if (newPassword != null && !newPassword.isBlank() && newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 6 caractères"));
        }
        try {
            User updated = userService.updateProfile(current,
                body.get("name"), newEmail, newPassword);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<User> listUsers() {
        return userService.listUsers();
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserCreateRequest req) {
        try {
            return ResponseEntity.ok(userService.createUser(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Modifier le rôle / poste d'un utilisateur */
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody UserRoleUpdateRequest req) {
        try {
            return ResponseEntity.ok(userService.updateUserRole(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Activer ou désactiver un compte */
    @PutMapping("/{id}/active")
    public ResponseEntity<?> toggleActive(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        try {
            boolean active = Boolean.TRUE.equals(body.get("active"));
            return ResponseEntity.ok(userService.toggleActive(id, active));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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
