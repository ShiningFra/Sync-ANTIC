/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.User;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User createUser(User newUser) {

        User current = SecurityUtils.getCurrentUserDetails().getUser();

        String role = current.getRole().getName();

        // Hash password before saving
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));

        // 🔥 SUPER ADMIN
        if (role.equals("super_admin")) {
            return userRepository.save(newUser);
        }

        // 🔥 ADMIN CIRT
        if (role.equals("admin_cirt")) {
            if (!newUser.getRole().getName().equals("agent")) {
                throw new RuntimeException("Cannot create admin");
            }
            return userRepository.save(newUser);
        }

        // 🔥 DIRECTEUR ANTENNE → peut créer uniquement des agents de son antenne
        if (role.equals("directeur_antenne")) {
            if (!newUser.getRole().getName().equals("agent")) {
                throw new RuntimeException("Directeur antenne can only create agents");
            }
            newUser.setAntenne(current.getAntenne());
            return userRepository.save(newUser);
        }

        throw new RuntimeException("Unauthorized");
    }
}
