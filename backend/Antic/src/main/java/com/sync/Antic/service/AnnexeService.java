/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.model.RoleType;
import com.sync.Antic.model.User;
import com.sync.Antic.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class AnnexeService {

private final UserRepository repo;
private final PasswordEncoder encoder;

public AnnexeService(UserRepository repo, PasswordEncoder encoder){
    this.repo = repo;
    this.encoder = encoder;
}

public User createAnnexe(){

long count=repo.count()+1;

String code="ANNEXE-"+String.format("%03d",count);

User user=new User();

user.setUsername(code);

user.setPassword(encoder.encode("default123"));

user.setRole(RoleType.ANNEXE);

user.setCreatedAt(LocalDateTime.now());

return repo.save(user);

}

}
