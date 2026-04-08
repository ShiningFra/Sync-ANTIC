package com.sync.Antic.service;

import com.sync.Antic.entity.*;
import org.springframework.stereotype.Service;

/**
 * Utilitaires de contrôle d'accès.
 * Hiérarchie : super_admin > directeur > admin_cirt > chef_service/agent_cirt
 *                                      > directeur_antenne > agent_antenne
 */
@Service
public class SecurityService {

    public boolean canAccessDossier(User user, Dossier dossier) {
        // super_admin et directeur voient tout
        if (user.isTopLevel()) return true;

        // admin_cirt voit tout sauf SECRET_PRIVE d'autrui
        if (user.isAdminCirt()) {
            return dossier.getSecurityLevel() != SecurityLevel.SECRET_PRIVE
                || isCreator(dossier, user);
        }

        // chef_service / agent_cirt : uniquement les dossiers synchronisés
        if (user.isChefService() || user.isAgentCirt()) {
            return dossier.isSyncedToCirt()
                && dossier.getSecurityLevel() != SecurityLevel.SECRET_PRIVE;
        }

        // directeur_antenne : son antenne, sauf SECRET_PRIVE d'autrui
        if (user.isDirecteurAntenne()) {
            return user.getAntenne() != null
                && dossier.getAntenne() != null
                && user.getAntenne().getId().equals(dossier.getAntenne().getId())
                && (dossier.getSecurityLevel() != SecurityLevel.SECRET_PRIVE || isCreator(dossier, user));
        }

        // agent_antenne : ses dossiers propres
        return isCreator(dossier, user);
    }

    private boolean isCreator(Dossier d, User u) {
        return d.getCreatedBy() != null && d.getCreatedBy().getId().equals(u.getId());
    }
}
