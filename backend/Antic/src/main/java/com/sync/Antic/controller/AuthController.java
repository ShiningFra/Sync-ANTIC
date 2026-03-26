package com.sync.Antic.controller;

import com.sync.Antic.entity.User;
import com.sync.Antic.repository.*;
import com.sync.Antic.service.JwtService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private UserRepository  userRepository;
    @Autowired private JwtService      jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {

        String email    = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email requis");
        }
        if (password == null || password.isBlank()) {
            throw new RuntimeException("Mot de passe requis");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (user.getPassword() == null) {
            throw new RuntimeException("Compte non configuré — contactez l'administrateur");
        }

        if (user.getRole() == null) {
            throw new RuntimeException("Rôle non assigné — contactez l'administrateur");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        String token = jwtService.generateToken(user);
        return Map.of("token", token);
    }

    /**
     * Endpoint de diagnostic — à supprimer après la mise en prod.
     * GET /auth/check?email=admin@antic.cm
     * Retourne si le compte existe et si son rôle est assigné.
     */
    @GetMapping("/check")
    public Map<String, Object> check(@RequestParam String email) {
        return userRepository.findByEmail(email)
                .map(u -> Map.<String, Object>of(
                        "found",    true,
                        "email",    u.getEmail(),
                        "name",     u.getName() != null ? u.getName() : "null",
                        "role",     u.getRole() != null ? u.getRole().getName() : "NULL — rôle manquant",
                        "hasPassword", u.getPassword() != null && !u.getPassword().isBlank()
                ))
                .orElse(Map.of("found", false, "email", email));
    }
}
