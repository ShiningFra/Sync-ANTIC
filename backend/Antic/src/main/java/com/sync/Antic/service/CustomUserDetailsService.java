/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.model.User;
import com.sync.Antic.repository.UserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

private final UserRepository repo;

public CustomUserDetailsService(UserRepository repo){
this.repo=repo;
}

@Override
public UserDetails loadUserByUsername(String username){

User user=repo.findByUsername(username).orElseThrow();

return new org.springframework.security.core.userdetails.User(
user.getUsername(),
user.getPassword(),
List.of(new SimpleGrantedAuthority(user.getRolet().name()))
);

}

}
