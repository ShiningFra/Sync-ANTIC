package com.sync.Antic.controller;

import com.sync.Antic.entity.User;
import com.sync.Antic.repository.UserRepository;
import com.sync.Antic.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private UserRepository  userRepo;
    @Autowired private JwtService      jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Email requis"));
        if (password == null || password.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Mot de passe requis"));

        User user = userRepo.findByEmail(email)
            .orElse(null);

        if (user == null || user.getPassword() == null)
            return ResponseEntity.status(401).body(Map.of("error", "Identifiants incorrects"));

        if (!user.isActive())
            return ResponseEntity.status(403).body(Map.of("error", "Compte désactivé — contactez l'administrateur"));

        if (!passwordEncoder.matches(password, user.getPassword()))
            return ResponseEntity.status(401).body(Map.of("error", "Identifiants incorrects"));

        String token = jwtService.generateToken(user);

        // Retourne le token + les infos de l'utilisateur pour le frontend
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", buildUserProfile(user));

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> buildUserProfile(User u) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", u.getId());
        profile.put("name", u.getName());
        profile.put("email", u.getEmail());
        profile.put("role", u.getRoleName());

        if (u.getAntenne() != null) {
            Map<String, Object> antenne = new HashMap<>();
            antenne.put("id", u.getAntenne().getId());
            antenne.put("name", u.getAntenne().getName());
            profile.put("antenne", antenne);
        }

        if (u.getService() != null) {
            Map<String, Object> svc = new HashMap<>();
            svc.put("id", u.getService().getId());
            svc.put("name", u.getService().getName());
            if (u.getService().getSousDirection() != null) {
                Map<String, Object> sd = new HashMap<>();
                sd.put("id", u.getService().getSousDirection().getId());
                sd.put("name", u.getService().getSousDirection().getName());
                svc.put("sousDirection", sd);
            }
            profile.put("service", svc);
        }

        return profile;
    }
}
