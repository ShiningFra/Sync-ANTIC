/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.security;

/**
 *
 * @author berna
 */
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static CustomUserDetails getCurrentUserDetails() {
        return (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
