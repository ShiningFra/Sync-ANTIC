/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 *
 * @author berna
 */
@ControllerAdvice
public class GlobalExceptionHandler {

@ExceptionHandler(RuntimeException.class)

public ResponseEntity<Map<String,String>> handle(RuntimeException e){

return ResponseEntity
.badRequest()
.body(Map.of("error",e.getMessage()));

}

}
