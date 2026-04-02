package com.sync.Antic.entity;

public enum Status {
    EN_ATTENTE,  // Dossier soumis par l'antenne, pas encore ouvert par le CIRT
    EN_COURS,    // Ouvert/pris en charge par le CIRT
    VALIDE,
    ARCHIVE
}
