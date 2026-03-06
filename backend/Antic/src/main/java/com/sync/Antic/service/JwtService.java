/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.util.Date;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class JwtService {

private String secret="antic-secret-key";

public String generateToken(String username){

return Jwts.builder()
.setSubject(username)
.setIssuedAt(new Date())
.setExpiration(new Date(System.currentTimeMillis()+86400000))
.signWith(SignatureAlgorithm.HS256,secret)
.compact();

}

public String extractUsername(String token){

return Jwts.parser()
.setSigningKey(secret)
.parseClaimsJws(token)
.getBody()
.getSubject();

}

}
