package com.sync.Antic.repository;

import com.sync.Antic.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByEtapeId(Long etapeId);
    List<Document> findByEtapeDossierId(Long dossierId);
}
