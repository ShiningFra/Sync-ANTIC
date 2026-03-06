/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.security;

/**
 *
 * @author berna
 */

import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

@Bean
public PasswordEncoder passwordEncoder(){
return new BCryptPasswordEncoder();
}

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

http
.cors()
.and()
.csrf().disable()

.authorizeHttpRequests()

.requestMatchers("/auth/**").permitAll()

.requestMatchers("/admin/**").hasAuthority("ADMIN")

.requestMatchers("/annexe/**").hasAuthority("ANNEXE")

.anyRequest().authenticated()

.and()
.sessionManagement()
.sessionCreationPolicy(SessionCreationPolicy.STATELESS);

return http.build();

}

}

