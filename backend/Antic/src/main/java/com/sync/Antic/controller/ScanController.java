package com.sync.Antic.controller;
import com.sync.Antic.entity.*;
import com.sync.Antic.service.ScanService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/scans")
public class ScanController {
    @Autowired private ScanService scanService;

    /** POST /scans/{dossierId}/urls — Soumettre une liste d'URLs (une par ligne) */
    @PostMapping("/{dossierId}/urls")
    @ResponseStatus(HttpStatus.CREATED)
    public List<ScanUrl> addUrls(@PathVariable Long dossierId,
                                  @RequestBody Map<String, String> body) {
        String urls = body.getOrDefault("urls", "");
        if (urls.isBlank()) throw new RuntimeException("Liste d'URLs vide");
        return scanService.addUrls(dossierId, urls);
    }

    /** GET /scans/{dossierId}/urls — Lister les URLs d'un dossier */
    @GetMapping("/{dossierId}/urls")
    public List<ScanUrl> getUrls(@PathVariable Long dossierId) {
        return scanService.getUrls(dossierId);
    }

    /** POST /scans/urls/{urlId}/result — Enregistrer un résultat d'analyse */
    @PostMapping("/urls/{urlId}/result")
    public ScanResult saveResult(@PathVariable Long urlId,
                                  @RequestBody Map<String, String> body) {
        return scanService.saveResult(urlId,
            body.getOrDefault("severity", "FAIBLE"),
            body.getOrDefault("rapport", ""));
    }

    /** GET /scans/{dossierId}/stats — Statistiques du dossier de scan */
    @GetMapping("/{dossierId}/stats")
    public Map<String, Object> stats(@PathVariable Long dossierId) {
        return scanService.getDossierStats(dossierId);
    }
}
