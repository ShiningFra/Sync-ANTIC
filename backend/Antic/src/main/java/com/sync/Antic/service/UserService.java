/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

/**
 *
 * @author berna
 */
import org.springframework.stereotype.Service;

import java.util.Optional;

import com.sync.Antic.model.User;

import com.sync.Antic.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public Optional<User> findByUsername(String username){

        return repository.findByUsername(username);

    }

    public User save(User user){

        return repository.save(user);

    }

}
