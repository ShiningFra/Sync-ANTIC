/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.config;

/**
 *
 * @author berna
 */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
public class CorsConfig {

@Bean
public CorsConfigurationSource corsConfigurationSource(){

CorsConfiguration configuration = new CorsConfiguration();

configuration.setAllowedOrigins(List.of(
"http://localhost:3000",
"http://localhost:5173"
));

configuration.setAllowedMethods(List.of(
"GET",
"POST",
"PUT",
"DELETE",
"OPTIONS"
));

configuration.setAllowedHeaders(List.of("*"));

configuration.setAllowCredentials(true);

UrlBasedCorsConfigurationSource source =
new UrlBasedCorsConfigurationSource();

source.registerCorsConfiguration("/**", configuration);

return source;
}

}
