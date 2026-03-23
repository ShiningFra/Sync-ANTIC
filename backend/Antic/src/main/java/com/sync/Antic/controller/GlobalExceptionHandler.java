/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.controller;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author berna
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage();
        if (msg == null) msg = "Unexpected error";

        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (msg.equalsIgnoreCase("Unauthorized") || msg.contains("Only ")) {
            status = HttpStatus.FORBIDDEN;
        } else if (msg.contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        }

        return ResponseEntity
                .status(status)
                .body(Map.of("error", msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handle(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal error"));
    }
}
