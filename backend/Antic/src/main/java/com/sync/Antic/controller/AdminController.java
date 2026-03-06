/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.model.User;
import com.sync.Antic.service.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/annexes")
    public User createAnnexe(){

        User annexe = new User();

        annexe.setUsername(generateAnnexeCode());

        annexe.setPassword("default");

        return userService.save(annexe);

    }

    private String generateAnnexeCode(){

        int number = (int)(Math.random()*1000);

        return "ANNEXE-" + String.format("%03d", number);

    }

}
