/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class SecurityService {

    public boolean canAccessDossier(User user, Dossier dossier) {

        String role = user.getRole().getName();

        if (role.equals("super_admin") || role.equals("admin_cirt")) {
            return true;
        }

        if (role.equals("directeur_antenne")) {
            return dossier.getAntenne().getId()
                    .equals(user.getAntenne().getId());
        }

        return dossier.getCreatedBy().getId()
                .equals(user.getId());
    }
}