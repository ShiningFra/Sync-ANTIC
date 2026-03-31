package com.sync.Antic.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scan_urls")
public class ScanUrl {
    public enum UrlStatus { EN_ATTENTE, ANALYSEE, ECHOUEE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    @JsonIgnore
    private Dossier dossier;

    @Column(nullable = false, length = 2048)
    private String url;

    @Enumerated(EnumType.STRING)
    private UrlStatus status = UrlStatus.EN_ATTENTE;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime analyzedAt;

    public Long getId() { return id; }
    public Dossier getDossier() { return dossier; }
    public String getUrl() { return url; }
    public UrlStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getAnalyzedAt() { return analyzedAt; }

    public void setId(Long id) { this.id = id; }
    public void setDossier(Dossier dossier) { this.dossier = dossier; }
    public void setUrl(String url) { this.url = url; }
    public void setStatus(UrlStatus status) { this.status = status; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public void setAnalyzedAt(LocalDateTime t) { this.analyzedAt = t; }
}
