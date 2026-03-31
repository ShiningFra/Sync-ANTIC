/**
 * Constantes de l'application — icônes et labels des catégories.
 * Les données réelles sont chargées depuis l'API.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Scans de Vulnérabilité':  'ShieldAlert',
  'Fermeture de Comptes':    'UserX',
  'Veille Informationnelle': 'Search',
  "Collecte d'Actifs":       'Database',
  'Base Points Focaux':      'Users',
  'Réquisitions':            'FileText',
  'Preuves Numériques':      'Fingerprint',
};

export const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

export const STATUS_LABELS = {
  EN_COURS: 'En cours',
  VALIDE:   'Validé',
  ARCHIVE:  'Archivé',
} as const;
