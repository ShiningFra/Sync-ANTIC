package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

    @Autowired private DocumentRepository  documentRepository;
    @Autowired private EtapeRepository     etapeRepository;
    @Autowired private FileStorageService  fileStorageService;

    public Document upload(Long etapeId, MultipartFile file) {
        User user = SecurityUtils.getCurrentUserDetails().getUser();
        Etape etape = etapeRepository.findById(etapeId)
            .orElseThrow(() -> new RuntimeException("Étape introuvable"));

        if (!canAccessDossier(user, etape.getDossier())) {
            throw new RuntimeException("Accès refusé à ce dossier");
        }

        String fileName = fileStorageService.saveFile(file);

        Document doc = new Document();
        doc.setFileName(file.getOriginalFilename());
        doc.setFileType(file.getContentType());
        doc.setFileUrl("/documents/files/" + fileName);
        doc.setEtape(etape);
        doc.setUploadedBy(user);
        return documentRepository.save(doc);
    }

    private boolean canAccessDossier(User user, Dossier dossier) {
        if (user.isSuperAdmin() || user.isAdminCirt()) return true;

        if (user.isChefService() || user.isAgentCirt()) {
            if (user.getService() == null || dossier.getService() == null) return false;
            return user.getService().getId().equals(dossier.getService().getId());
        }

        if (user.isDirecteurAntenne()) {
            if (user.getAntenne() == null || dossier.getAntenne() == null) return false;
            return user.getAntenne().getId().equals(dossier.getAntenne().getId());
        }

        if (user.isAgentAntenne()) {
            if (dossier.getCreatedBy() == null) return false;
            return dossier.getCreatedBy().getId().equals(user.getId());
        }

        return false;
    }
}
