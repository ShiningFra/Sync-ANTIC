package com.sync.Antic.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage();
        if (msg == null) msg = "Erreur interne";
        
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (msg.toLowerCase().contains("accès refusé") || msg.toLowerCase().contains("unauthorized") || msg.toLowerCase().contains("droits")) {
            status = HttpStatus.FORBIDDEN;
        }
        if (msg.toLowerCase().contains("introuvable")) {
            status = HttpStatus.NOT_FOUND;
        }
        
        return ResponseEntity.status(status).body(Map.of("error", msg));
    }
}
