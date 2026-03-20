/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.entity;

/**
 *
 * @author berna
 */
public class DossierDTO {
    public Long id;
    public String title;
    public String status;
    
    public static DossierDTO toDTO(Dossier d) {
        DossierDTO dto = new DossierDTO();
        dto.id = d.getId();
        dto.title = d.getTitle();
        dto.status = d.getStatus().name();
        return dto;
    }
}
