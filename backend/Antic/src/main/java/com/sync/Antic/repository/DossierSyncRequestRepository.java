package com.sync.Antic.repository;

import com.sync.Antic.entity.DossierSyncRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DossierSyncRequestRepository extends JpaRepository<DossierSyncRequest, Long> {
    List<DossierSyncRequest> findByDossierAntenneId(Long antenneId);
    List<DossierSyncRequest> findByRequestedById(Long userId);
    List<DossierSyncRequest> findByStatus(DossierSyncRequest.SyncStatus status);
    Optional<DossierSyncRequest> findByDossierIdAndStatus(Long dossierId, DossierSyncRequest.SyncStatus status);
    boolean existsByDossierIdAndStatus(Long dossierId, DossierSyncRequest.SyncStatus status);
}
