/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.service;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author berna
 */
@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String saveFile(MultipartFile file) {

        String type = file.getContentType();

        if (type == null ||
            (!type.equals("application/pdf") &&
            !type.startsWith("image/"))) {
            throw new RuntimeException("Invalid file type");
        }

        String cleanName = StringUtils.cleanPath(file.getOriginalFilename());

        String fileName = UUID.randomUUID() + "_" + cleanName;

        Path path = Paths.get(uploadDir).toAbsolutePath();

        try {
            Files.createDirectories(path);

            Path target = path.resolve(fileName);

            Files.copy(file.getInputStream(), target,
                       StandardCopyOption.REPLACE_EXISTING);

            return fileName;

        } catch (IOException e) {
            throw new RuntimeException("Upload failed");
        }
    }
}
