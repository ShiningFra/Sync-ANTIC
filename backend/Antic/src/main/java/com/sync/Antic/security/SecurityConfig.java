/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.security;

/**
 *
 * @author berna
 */

import com.sync.Antic.security.JwtFilter;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

@Autowired
JwtFilter jwtFilter;

@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception{

http
.csrf().disable()
.cors().and()
.authorizeHttpRequests()

.requestMatchers("/auth/**").permitAll()

.requestMatchers("/admin/**").hasRole("ADMIN")

.requestMatchers("/annexe/**").hasRole("ANNEXE")

.anyRequest().authenticated()

.and()
.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

return http.build();

}

@Bean
PasswordEncoder passwordEncoder(){

return new BCryptPasswordEncoder();

}

}