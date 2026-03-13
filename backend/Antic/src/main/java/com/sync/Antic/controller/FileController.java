/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.model.FileAttachment;
import com.sync.Antic.repository.FileAttachmentRepository;
import com.sync.Antic.service.FileService;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author berna
 */
@RestController
@RequestMapping("/files")
public class FileController {

    private final FileService fileService;
    private final FileAttachmentRepository fileRepo;

    public FileController(FileService fileService, FileAttachmentRepository fileRepo) {
        this.fileService = fileService;
        this.fileRepo = fileRepo;
    }

    @PostMapping("/upload/{id}")
    public String uploadFile(
            @PathVariable Long id,
            @RequestParam MultipartFile file
    ) throws Exception {

        String path = fileService.storeFile(id, file);

FileAttachment attachment = new FileAttachment();

attachment.setFileName(file.getOriginalFilename());
attachment.setFilePath(path);

fileRepo.save(attachment);

return "uploaded";

    }
    
    @GetMapping("/download/{id}")
public ResponseEntity<Resource> download(@PathVariable Long id) throws Exception{

FileAttachment file=fileRepo.findById(id).orElseThrow();

Path path=Paths.get(file.getFilePath());

Resource resource=new UrlResource(path.toUri());

return ResponseEntity.ok()
.header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename="+file.getFileName())
.body(resource);

}

@GetMapping("/preview/{id}")
public ResponseEntity<Resource> preview(@PathVariable Long id) throws Exception {

    FileAttachment file = fileRepo.findById(id).orElseThrow();

    Path path = Paths.get(file.getFilePath());

    Resource resource = new UrlResource(path.toUri());

    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + file.getFileName() + "\"")
            .body(resource);
}

@GetMapping("/dossier/{id}")
public List<FileAttachment> getFiles(@PathVariable Long id){

    return fileRepo.findByDossierId(id);

}

}
