package com.sync.Antic.repository;
import com.sync.Antic.entity.ScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ScanResultRepository extends JpaRepository<ScanResult, Long> {
    Optional<ScanResult> findByScanUrlId(Long scanUrlId);
}
