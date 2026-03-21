/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import com.sync.Antic.entity.Document;
import com.sync.Antic.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
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
}
