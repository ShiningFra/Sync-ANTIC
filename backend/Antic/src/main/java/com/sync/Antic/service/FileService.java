/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

/**
 *
 * @author berna
 */

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;

@Service
public class FileService {

    @Value("${upload.path}")
    private String uploadPath;

    public String storeFile(Long dossierId, MultipartFile file) throws Exception {

        Path dossierFolder = Paths.get(uploadPath + "/dossier_" + dossierId);

        if(!Files.exists(dossierFolder)){

            Files.createDirectories(dossierFolder);

        }

        Path filePath = dossierFolder.resolve(file.getOriginalFilename());

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath.toString();
    }

}
