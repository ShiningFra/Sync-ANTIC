/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.CategoryRepository;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 *
 * @author berna
 */
@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category createCategory(Category category) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        if (user.getRole().getName().equals("agent")) {
            throw new RuntimeException("Unauthorized");
        }

        category.setCreatedBy(user);

        return categoryRepository.save(category);
    }
}
