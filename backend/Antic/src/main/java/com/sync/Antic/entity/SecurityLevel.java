package com.sync.Antic.entity;

/**
 * Niveaux de sécurité pour les dossiers et catégories.
 *
 * SECRET_PRIVE  : Visible uniquement par le créateur (agent_antenne).
 *                  Même le directeur d'antenne ne voit pas.
 * ANTENNE_PRIVE : Visible uniquement par le directeur d'antenne de l'antenne d'origine,
 *                  plus les membres CIRT autorisés.
 * ANTENNE_PUBLIC: Visible par tous les agents de l'antenne d'origine (ayant la catégorie).
 * CIRT_ONLY    : Visible uniquement par les membres CIRT.
 * PUBLIC       : Visible par tous les utilisateurs autorisés (défaut).
 */
public enum SecurityLevel {
    SECRET_PRIVE,   // Seul le créateur voit
    ANTENNE_PRIVE,  // Directeur antenne + CIRT voient
    ANTENNE_PUBLIC, // Tous agents de l'antenne (avec catégorie) voient
    CIRT_ONLY,      // CIRT uniquement
    PUBLIC          // Tous ceux qui ont la catégorie
}
