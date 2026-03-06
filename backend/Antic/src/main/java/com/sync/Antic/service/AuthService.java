/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.model.User;
import com.sync.Antic.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class AuthService {

private final UserRepository repo;
private final PasswordEncoder encoder;
private final JwtService jwt;

public AuthService(UserRepository repo,PasswordEncoder encoder,JwtService jwt){

this.repo=repo;
this.encoder=encoder;
this.jwt=jwt;

}

public String login(String username,String password){

User user=repo.findByUsername(username).orElseThrow();

if(!encoder.matches(password,user.getPassword()))
throw new RuntimeException("Bad credentials");

return jwt.generateToken(username);

}

}
