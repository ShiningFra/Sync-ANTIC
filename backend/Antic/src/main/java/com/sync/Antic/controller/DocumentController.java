package com.sync.Antic.controller;

import com.sync.Antic.entity.Document;
import com.sync.Antic.entity.User;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.DocumentService;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    @Autowired private DocumentService documentService;
    @Value("${file.upload-dir}") private String uploadDir;

    /** Upload un document attaché à une étape */
    @PostMapping(value = "/{etapeId}", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public Document upload(@PathVariable Long etapeId,
                           @RequestParam("file") MultipartFile file) {
        return documentService.upload(etapeId, file);
    }

    /** Liste tous les documents d'un dossier (toutes étapes confondues) */
    @GetMapping("/dossier/{dossierId}")
    public List<Document> getByDossier(@PathVariable Long dossierId) {
        return documentService.getByDossier(dossierId);
    }

    /** Liste les documents d'une étape */
    @GetMapping("/etape/{etapeId}")
    public List<Document> getByEtape(@PathVariable Long etapeId) {
        return documentService.getByEtape(etapeId);
    }

    /** Supprime un document */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        documentService.delete(id);
    }

    /** Sert le fichier physique (inline pour visualisation) */
    @GetMapping("/files/{name}")
    public ResponseEntity<Resource> getFile(@PathVariable String name) throws MalformedURLException {
        SecurityUtils.getCurrentUserDetails(); // vérif auth
        Path path = Paths.get(uploadDir).toAbsolutePath().resolve(name);
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + name + "\"")
            .body(resource);
    }
}
