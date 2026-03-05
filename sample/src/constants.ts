import { Category, Dossier } from './types';

export const CATEGORIES: Category[] = [
  { id: 'scans-vulnerabilite', label: 'Scans de vulnérabilité', icon: 'ShieldAlert' },
  { id: 'fermeture-comptes', label: 'Fermeture de comptes', icon: 'UserX' },
  { id: 'veille-informationnelle', label: 'Veille informationnelle', icon: 'Search' },
  { id: 'collecte-actifs', label: 'Collecte des actifs TIC', icon: 'Database' },
  { id: 'base-points-focaux', label: 'Base de données points focaux', icon: 'Users' },
  { id: 'requisitions', label: 'Réquisitions', icon: 'FileText' },
  { id: 'authentification-preuves', label: 'Authentification de preuve numérique', icon: 'Fingerprint' },
];

export const MOCK_DOSSIERS: Dossier[] = [
  {
    id: '1',
    title: 'Scan Réseau Ministère X',
    description: 'Rapport trimestriel de vulnérabilité pour le réseau local du Ministère X.',
    categoryId: 'scans-vulnerabilite',
    annexeId: 'annexe-yde',
    annexeName: 'Annexe Yaoundé',
    createdAt: '2024-03-01T10:00:00Z',
    status: 'PENDING',
    attachments: [
      { id: 'a1', name: 'rapport_scan.pdf', size: '2.4 MB', type: 'application/pdf', url: '#' },
      { id: 'a2', name: 'logs_bruts.csv', size: '1.1 MB', type: 'text/csv', url: '#' },
    ]
  },
  {
    id: '2',
    title: 'Faux compte Facebook Ministre Y',
    description: 'Signalement et demande de fermeture d\'un compte usurpant l\'identité du Ministre Y.',
    categoryId: 'fermeture-comptes',
    annexeId: 'annexe-dla',
    annexeName: 'Annexe Douala',
    createdAt: '2024-03-02T14:30:00Z',
    status: 'VALIDATED',
    validatedAt: '2024-03-03T09:00:00Z',
    validatedBy: 'CIRT Admin',
    attachments: [
      { id: 'a3', name: 'capture_ecran.png', size: '800 KB', type: 'image/png', url: '#' },
    ]
  },
  {
    id: '3',
    title: 'Inventaire Serveurs Entreprise Z',
    description: 'Collecte annuelle des actifs critiques de l\'entreprise Z.',
    categoryId: 'collecte-actifs',
    annexeId: 'annexe-gar',
    annexeName: 'Annexe Garoua',
    createdAt: '2024-03-04T11:20:00Z',
    status: 'PENDING',
    attachments: [
      { id: 'a4', name: 'inventaire_v1.xlsx', size: '450 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#' },
    ]
  }
];

export const ANNEXES = [
  { id: 'annexe-yde', name: 'Annexe Yaoundé' },
  { id: 'annexe-dla', name: 'Annexe Douala' },
  { id: 'annexe-gar', name: 'Annexe Garoua' },
  { id: 'annexe-baf', name: 'Annexe Bafoussam' },
  { id: 'annexe-bam', name: 'Annexe Bamenda' },
];
