package com.sync.Antic.service;
import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gestion des Scans de Vulnérabilité (CDC §15)
 * Chaque URL est stockée individuellement pour permettre
 * une exploitation statistique fine.
 */
@Service
public class ScanService {
    @Autowired private ScanUrlRepository scanUrlRepo;
    @Autowired private ScanResultRepository scanResultRepo;
    @Autowired private DossierRepository dossierRepo;

    private User currentUser() { return SecurityUtils.getCurrentUserDetails().getUser(); }

    /**
     * Ajoute une liste d'URLs (une par ligne) à un dossier de scan.
     * Chaque URL est enregistrée individuellement.
     */
    @Transactional
    public List<ScanUrl> addUrls(Long dossierId, String urlsText) {
        Dossier dossier = dossierRepo.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        List<ScanUrl> created = new ArrayList<>();
        for (String line : urlsText.split("\\n")) {
            String url = line.trim();
            if (url.isEmpty()) continue;
            if (!url.startsWith("http://") && !url.startsWith("https://"))
                url = "https://" + url;
            ScanUrl su = new ScanUrl();
            su.setDossier(dossier);
            su.setUrl(url);
            created.add(scanUrlRepo.save(su));
        }
        return created;
    }

    public List<ScanUrl> getUrls(Long dossierId) {
        return scanUrlRepo.findByDossierId(dossierId);
    }

    /** Enregistre ou met à jour le résultat d'analyse d'une URL */
    @Transactional
    public ScanResult saveResult(Long scanUrlId, String severity, String rapport) {
        ScanUrl scanUrl = scanUrlRepo.findById(scanUrlId)
            .orElseThrow(() -> new RuntimeException("URL introuvable"));

        ScanResult result = scanResultRepo.findByScanUrlId(scanUrlId)
            .orElse(new ScanResult());
        result.setScanUrl(scanUrl);
        result.setSeverity(ScanResult.Severity.valueOf(severity));
        result.setRapport(rapport);
        result.setScannedAt(LocalDateTime.now());
        ScanResult saved = scanResultRepo.save(result);

        // Mettre à jour le statut de l'URL
        scanUrl.setStatus(ScanUrl.UrlStatus.ANALYSEE);
        scanUrl.setAnalyzedAt(LocalDateTime.now());
        scanUrlRepo.save(scanUrl);

        return saved;
    }

    /** Statistiques globales pour un dossier de scan */
    public Map<String, Object> getDossierStats(Long dossierId) {
        List<ScanUrl> urls = scanUrlRepo.findByDossierId(dossierId);
        long total = urls.size();
        long enAttente = urls.stream().filter(u -> u.getStatus() == ScanUrl.UrlStatus.EN_ATTENTE).count();
        long analysees = urls.stream().filter(u -> u.getStatus() == ScanUrl.UrlStatus.ANALYSEE).count();
        long echouees  = urls.stream().filter(u -> u.getStatus() == ScanUrl.UrlStatus.ECHOUEE).count();

        // Répartition par niveau de vulnérabilité
        List<ScanResult> results = scanResultRepo.findAll().stream()
            .filter(r -> r.getScanUrl().getDossier().getId().equals(dossierId))
            .collect(Collectors.toList());
        long faible = results.stream().filter(r -> r.getSeverity() == ScanResult.Severity.FAIBLE).count();
        long moyen  = results.stream().filter(r -> r.getSeverity() == ScanResult.Severity.MOYEN).count();
        long eleve  = results.stream().filter(r -> r.getSeverity() == ScanResult.Severity.ELEVE).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("enAttente", enAttente);
        stats.put("analysees", analysees);
        stats.put("echouees", echouees);
        stats.put("vulnFaible", faible);
        stats.put("vulnMoyen", moyen);
        stats.put("vulnEleve", eleve);
        return stats;
    }
}
