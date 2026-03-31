package com.sync.Antic.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scan_results")
public class ScanResult {
    public enum Severity { FAIBLE, MOYEN, ELEVE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "scan_url_id", nullable = false, unique = true)
    private ScanUrl scanUrl;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(columnDefinition = "TEXT")
    private String rapport;

    private LocalDateTime scannedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public ScanUrl getScanUrl() { return scanUrl; }
    public Severity getSeverity() { return severity; }
    public String getRapport() { return rapport; }
    public LocalDateTime getScannedAt() { return scannedAt; }

    public void setId(Long id) { this.id = id; }
    public void setScanUrl(ScanUrl s) { this.scanUrl = s; }
    public void setSeverity(Severity s) { this.severity = s; }
    public void setRapport(String r) { this.rapport = r; }
    public void setScannedAt(LocalDateTime t) { this.scannedAt = t; }
}
