package com.sync.Antic.repository;

import com.sync.Antic.entity.PermissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PermissionCategoryRepository extends JpaRepository<PermissionCategory, Long> {
    List<PermissionCategory> findByUserId(Long userId);
    List<PermissionCategory> findByCategoryId(Long categoryId);
    boolean existsByUserIdAndCategoryId(Long userId, Long categoryId);
    void deleteByUserIdAndCategoryId(Long userId, Long categoryId);
}
