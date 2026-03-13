/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.sync.Antic.repository;

/**
 *
 * @author berna
 */
import com.sync.Antic.model.FileAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment,Long> {
    List<FileAttachment> findByDossierId(Long id);
}
