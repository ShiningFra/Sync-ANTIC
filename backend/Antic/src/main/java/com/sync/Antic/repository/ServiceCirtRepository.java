package com.sync.Antic.repository;

import com.sync.Antic.entity.ServiceCirt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceCirtRepository extends JpaRepository<ServiceCirt, Long> {
    List<ServiceCirt> findBySousDirectionId(Long sousDirectionId);
}
