/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.User;
import com.sync.Antic.repository.PermissionCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class PermissionService {

    @Autowired
    private PermissionCategoryRepository repo;

    public boolean canAccessCategory(User user, Long categoryId) {

        if (user.getRole().getName().contains("cirt")) {
            return true;
        }

        return repo.findByUserId(user.getId())
                .stream()
                .anyMatch(p -> p.getCategory().getId().equals(categoryId));
    }
}
