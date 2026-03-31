package com.sync.Antic.repository;

import com.sync.Antic.entity.Dossier;
import com.sync.Antic.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DossierRepository extends JpaRepository<Dossier, Long> {

    List<Dossier> findByAntenneId(Long antenneId);

    List<Dossier> findByCreatedById(Long userId);

    List<Dossier> findByServiceId(Long serviceId);

    List<Dossier> findByServiceIdAndCategoryIdIn(Long serviceId, List<Long> categoryIds);

    List<Dossier> findByCategoryId(Long categoryId);

    List<Dossier> findByStatus(Status status);

    List<Dossier> findByAntenneIdAndStatus(Long antenneId, Status status);

    List<Dossier> findByAntenneIdAndCategoryId(Long antenneId, Long categoryId);

    @Query("SELECT d FROM Dossier d WHERE d.antenne.id = :antenneId AND d.category.id = :catId AND d.status = :status")
    List<Dossier> findByAntenneAndCategoryAndStatus(
        @Param("antenneId") Long antenneId,
        @Param("catId") Long catId,
        @Param("status") Status status
    );

    @Query("SELECT d FROM Dossier d WHERE YEAR(d.createdAt) = :year")
    List<Dossier> findByYear(@Param("year") int year);

    @Query("SELECT d FROM Dossier d WHERE YEAR(d.createdAt) = :year AND MONTH(d.createdAt) = :month")
    List<Dossier> findByYearAndMonth(@Param("year") int year, @Param("month") int month);

    long countByAntenneIdAndCategoryId(Long antenneId, Long categoryId);

    long countByAntenneIdAndCategoryIdAndStatus(Long antenneId, Long categoryId, Status status);

    long countByCategoryId(Long categoryId);

    long countByCategoryIdAndStatus(Long categoryId, Status status);
}
