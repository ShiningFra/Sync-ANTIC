package com.sync.Antic.repository;

import com.sync.Antic.entity.SousDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SousDirectionRepository extends JpaRepository<SousDirection, Long> {
    Optional<SousDirection> findByDirecteurId(Long directeurId);
}
