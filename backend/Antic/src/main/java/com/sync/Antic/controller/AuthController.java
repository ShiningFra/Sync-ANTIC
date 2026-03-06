/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.dto.LoginRequest;
import com.sync.Antic.service.AuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author berna
 */

@RestController
@RequestMapping("/auth")
public class AuthController {

private final AuthService authService;

public AuthController(AuthService authService){
this.authService=authService;
}

@PostMapping("/login")
public Map<String,String> login(@RequestBody LoginRequest request){

String token=authService.login(request.getUsername(),request.getPassword());

return Map.of("token",token);

}

}
