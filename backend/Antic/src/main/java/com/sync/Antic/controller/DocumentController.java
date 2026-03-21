/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.entity.Document;
import com.sync.Antic.entity.User;
import com.sync.Antic.security.SecurityUtils;
import com.sync.Antic.service.DocumentService;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

     @PostMapping(value = "/{etapeId}", consumes = "multipart/form-data")
        public Document upload(
                @PathVariable Long etapeId,
                @RequestParam("file") MultipartFile file
        ) {
            return documentService.upload(etapeId, file);
        }
        
    @GetMapping("/files/{name}")
    public ResponseEntity<Resource> getFile(@PathVariable String name) throws MalformedURLException {

        User user = SecurityUtils.getCurrentUserDetails().getUser();

        // 👉 vérifier si user a accès au document

        Path path = Paths.get("uploads").resolve(name);

        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + name + "\"")
            .body(resource);
    }
}
