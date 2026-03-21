/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author berna
 */
@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private EtapeRepository etapeRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    public Document upload(Long etapeId, MultipartFile file) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        Etape etape = etapeRepository.findById(etapeId)
                .orElseThrow();

        if (!canAccessDossier(user, etape.getDossier())) {
            throw new RuntimeException("Unauthorized");
        }

        String fileName = fileStorageService.saveFile(file);

        Document doc = new Document();
        doc.setFileName(file.getOriginalFilename());
        doc.setFileType(file.getContentType());
        doc.setFileUrl("/files/" + fileName);
        doc.setEtape(etape);
        doc.setUploadedBy(user);

        return documentRepository.save(doc);
    }

    public Document addDocument(Long etapeId, Document doc) {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        Etape etape = etapeRepository.findById(etapeId)
                .orElseThrow();

        // 🔐 Vérification accès via dossier
        if (!canAccessDossier(user, etape.getDossier())) {
            throw new RuntimeException("Unauthorized");
        }

        doc.setEtape(etape);
        doc.setUploadedBy(user);

        return documentRepository.save(doc);
    }
    
    private boolean canAccessDossier(User user, Dossier dossier) {

        String role = user.getRole().getName();

        // CIRT → accès total
        if (role.equals("super_admin") || role.equals("admin_cirt")) {
            return true;
        }

        // Directeur antenne → son antenne
        if (role.equals("directeur_antenne")) {
            return dossier.getAntenne().getId().equals(user.getAntenne().getId());
        }

        // Agent → seulement ses dossiers
        if (role.equals("agent")) {
            return dossier.getCreatedBy().getId().equals(user.getId());
        }

        return false;
    }
}
