package com.sync.Antic.repository;

import com.sync.Antic.entity.AntenneCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AntenneCategoryRepository extends JpaRepository<AntenneCategory, Long> {
    List<AntenneCategory> findByAntenneId(Long antenneId);
    List<AntenneCategory> findByCategoryId(Long categoryId);
    boolean existsByAntenneIdAndCategoryId(Long antenneId, Long categoryId);
    void deleteByAntenneIdAndCategoryId(Long antenneId, Long categoryId);
    void deleteByAntenneId(Long antenneId);
    void deleteByCategoryId(Long categoryId);
}
