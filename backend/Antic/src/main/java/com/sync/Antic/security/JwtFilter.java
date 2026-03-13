/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.security;

import com.sync.Antic.service.CustomUserDetailsService;
import com.sync.Antic.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 *
 * @author berna
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

@Autowired
JwtService jwtService;

@Autowired
CustomUserDetailsService userDetailsService;

@Override
protected void doFilterInternal(HttpServletRequest request,
HttpServletResponse response,
FilterChain filterChain)
throws ServletException, IOException {

String header = request.getHeader("Authorization");

if(header != null && header.startsWith("Bearer ")){

String token = header.substring(7);

String username = jwtService.extractUsername(token);

UserDetails user = userDetailsService.loadUserByUsername(username);

UsernamePasswordAuthenticationToken auth =
new UsernamePasswordAuthenticationToken(
user,null,user.getAuthorities());

SecurityContextHolder.getContext().setAuthentication(auth);

}

filterChain.doFilter(request,response);

}

}
