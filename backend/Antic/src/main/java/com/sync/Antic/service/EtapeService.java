package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import com.sync.Antic.security.SecurityUtils;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EtapeService {

    @Autowired private EtapeRepository   etapeRepository;
    @Autowired private DossierRepository dossierRepository;

    public Etape createEtape(Long dossierId, Etape etape) {
        User user = SecurityUtils.getCurrentUserDetails().getUser();
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        if (!canAccessDossier(user, dossier)) {
            throw new RuntimeException("Accès refusé à ce dossier");
        }

        etape.setDossier(dossier);
        etape.setCreatedBy(user);
        return etapeRepository.save(etape);
    }

    public List<Etape> getEtapesByDossier(Long dossierId) {
        User user = SecurityUtils.getCurrentUserDetails().getUser();
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        if (!canAccessDossier(user, dossier)) {
            throw new RuntimeException("Accès refusé à ce dossier");
        }

        return etapeRepository.findByDossierId(dossierId);
    }

    private boolean canAccessDossier(User user, Dossier dossier) {
        // super_admin et admin_cirt → accès total
        if (user.isSuperAdmin() || user.isAdminCirt()) return true;

        // chef_service et agent_cirt → dossiers de leur service
        if (user.isChefService() || user.isAgentCirt()) {
            if (user.getService() == null || dossier.getService() == null) return false;
            return user.getService().getId().equals(dossier.getService().getId());
        }

        // directeur_antenne → son antenne
        if (user.isDirecteurAntenne()) {
            if (user.getAntenne() == null || dossier.getAntenne() == null) return false;
            return user.getAntenne().getId().equals(dossier.getAntenne().getId());
        }

        // agent_antenne → ses propres dossiers uniquement
        if (user.isAgentAntenne()) {
            if (dossier.getCreatedBy() == null) return false;
            return dossier.getCreatedBy().getId().equals(user.getId());
        }

        return false;
    }
}
