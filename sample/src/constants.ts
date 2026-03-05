import { Category, Dossier, AnnexeAccount } from './types';

export const CATEGORIES: Category[] = [
  { id: 'accueil', label: 'Accueil', icon: 'Home', description: 'Vue d\'ensemble de tous les traitements' },
  { id: 'scans-vulnerabilite', label: 'Scans de vulnérabilité', icon: 'ShieldAlert', description: 'Rapports et analyses de vulnérabilités réseau' },
  { id: 'fermeture-comptes', label: 'Fermeture de comptes', icon: 'UserX', description: 'Signalement et suppression de faux comptes' },
  { id: 'veille-informationnelle', label: 'Veille informationnelle', icon: 'Search', description: 'Surveillance des menaces et tendances' },
  { id: 'collecte-actifs', label: 'Collecte des actifs TIC', icon: 'Database', description: 'Inventaire des ressources technologiques' },
  { id: 'base-points-focaux', label: 'Points focaux', icon: 'Users', description: 'Base de données des contacts entreprises' },
  { id: 'requisitions', label: 'Réquisitions', icon: 'FileText', description: 'Gestion des demandes officielles' },
  { id: 'authentification-preuves', label: 'Preuves numériques', icon: 'Fingerprint', description: 'Vérification et intégrité des données' },
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

export const MOCK_ANNEXE_ACCOUNTS: AnnexeAccount[] = [
  { id: '1', name: 'Annexe Yaoundé', annexeId: 'YDE-782-X', defaultPassword: 'pass-yde-123', createdAt: '2024-01-15T08:00:00Z' },
  { id: '2', name: 'Annexe Douala', annexeId: 'DLA-441-Y', defaultPassword: 'pass-dla-456', createdAt: '2024-01-20T09:30:00Z' },
];
