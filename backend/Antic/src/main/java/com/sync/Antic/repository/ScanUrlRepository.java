package com.sync.Antic.repository;
import com.sync.Antic.entity.ScanUrl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;

public interface ScanUrlRepository extends JpaRepository<ScanUrl, Long> {
    List<ScanUrl> findByDossierId(Long dossierId);
    long countByDossierIdAndStatus(Long dossierId, ScanUrl.UrlStatus status);

    @Query("SELECT COUNT(s) FROM ScanUrl s WHERE s.dossier.id = :did")
    long countByDossierId(@Param("did") Long dossierId);
}
