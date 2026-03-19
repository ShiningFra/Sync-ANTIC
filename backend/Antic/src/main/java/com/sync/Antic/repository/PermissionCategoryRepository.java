/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.repository;

/**
 *
 * @author berna
 */
import com.sync.Antic.entity.PermissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermissionCategoryRepository extends JpaRepository<PermissionCategory, Long> {

    List<PermissionCategory> findByUserId(Long userId);

    List<PermissionCategory> findByCategoryId(Long categoryId);
}
