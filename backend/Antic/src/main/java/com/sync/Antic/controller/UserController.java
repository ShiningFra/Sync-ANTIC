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
}
