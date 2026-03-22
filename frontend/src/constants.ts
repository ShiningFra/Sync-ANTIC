import { Category, Dossier, Antenne, User } from './types';

export const CATEGORIES: Category[] = [
  { 
    id: 'accueil', 
    label: 'Accueil', 
    icon: 'Home',
    description: 'Vue d\'ensemble de l\'activité et statistiques globales.'
  },
  { 
    id: 'scans-vulnerabilite', 
    label: 'Scans de Vulnérabilité', 
    icon: 'ShieldAlert',
    description: 'Rapports de scans et détection de failles de sécurité.'
  },
  { 
    id: 'fermeture-comptes', 
    label: 'Fermeture de Comptes', 
    icon: 'UserX',
    description: 'Demandes de suspension ou suppression de comptes compromis.'
  },
  { 
    id: 'veille-informationnelle', 
    label: 'Veille Informationnelle', 
    icon: 'Search',
    description: 'Surveillance des menaces et alertes de sécurité.'
  },
  { 
    id: 'collecte-actifs', 
    label: 'Collecte d\'Actifs', 
    icon: 'Database',
    description: 'Inventaire et suivi des actifs numériques critiques.'
  },
  { 
    id: 'base-points-focaux', 
    label: 'Base Points Focaux', 
    icon: 'Users',
    description: 'Répertoire des contacts techniques et administratifs.'
  },
  { 
    id: 'requisitions', 
    label: 'Réquisitions', 
    icon: 'FileText',
    description: 'Gestion des demandes légales et administratives.'
  },
  { 
    id: 'authentification-preuves', 
    label: 'Preuves Numériques', 
    icon: 'Fingerprint',
    description: 'Authentification et conservation des preuves numériques.'
  },
];

export const ANTENNES: Antenne[] = [
  { id: 'yde', name: 'Antenne Yaoundé', location: 'Yaoundé' },
  { id: 'dla', name: 'Antenne Douala', location: 'Douala' },
  { id: 'gar', name: 'Antenne Garoua', location: 'Garoua' },
  { id: 'baf', name: 'Antenne Bafoussam', location: 'Bafoussam' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'directeur_cirt',
    name: 'M. le Directeur du CIRT',
    role: 'SUPER_ADMIN',
    affiliation: 'CIRT'
  },
  {
    id: 'u2',
    username: 'admin_cirt_1',
    name: 'Admin CIRT Nord',
    role: 'CIRT_ADMIN',
    affiliation: 'CIRT',
    createdBy: 'u1'
  },
  {
    id: 'u3',
    username: 'dir_yde',
    name: 'Directeur Antenne Yaoundé',
    role: 'ANTENNE_DIRECTOR',
    affiliation: 'ANTENNE',
    antenneId: 'yde',
    createdBy: 'u1'
  },
  {
    id: 'u4',
    username: 'agent_yde',
    name: 'Agent Yaoundé',
    role: 'ANTENNE_SIMPLE',
    affiliation: 'ANTENNE',
    antenneId: 'yde',
    createdBy: 'u3'
  }
];

export const MOCK_DOSSIERS: Dossier[] = [
  {
    id: 'D-2024-03-001',
    title: 'Scan Réseau Ministère X',
    description: 'Détection de vulnérabilités critiques sur le serveur principal.',
    categoryId: 'scans-vulnerabilite',
    antenneId: 'yde',
    antenneName: 'Antenne Yaoundé',
    createdAt: '2024-03-15T10:00:00Z',
    year: 2024,
    month: 3,
    day: 15,
    status: 'PENDING',
    attachments: [
      { id: 'a1', name: 'rapport_scan.pdf', size: '2.4 MB', type: 'application/pdf', url: '#' }
    ],
    steps: [
      {
        id: 's1',
        label: 'Collecte des logs',
        description: 'Récupérer les logs du pare-feu sur les 3 derniers mois.',
        requiredFrom: 'REALIZATION',
        status: 'COMPLETED',
        attachments: [{ id: 'at1', name: 'logs_firewall.zip', size: '15 MB', type: 'application/zip', url: '#' }],
        completedAt: '2024-03-15T11:00:00Z',
        completedBy: 'u4'
      },
      {
        id: 's2',
        label: 'Analyse des vulnérabilités',
        description: 'Identifier les CVE critiques et proposer des correctifs.',
        requiredFrom: 'SUPERVISION',
        status: 'PENDING',
        attachments: []
      }
    ],
    createdBy: 'u4'
  },
  {
    id: 'D-2024-03-002',
    title: 'Réquisition Judiciaire #45',
    description: 'Demande d\'identification d\'adresse IP.',
    categoryId: 'requisitions',
    antenneId: 'dla',
    antenneName: 'Antenne Douala',
    createdAt: '2024-03-16T14:30:00Z',
    year: 2024,
    month: 3,
    day: 16,
    status: 'VALIDATED',
    attachments: [
      { id: 'a2', name: 'ordonnance.pdf', size: '1.1 MB', type: 'application/pdf', url: '#' }
    ],
    steps: [
      {
        id: 's1',
        label: 'Vérification de l\'ordonnance',
        description: 'S\'assurer de la validité juridique de la demande.',
        requiredFrom: 'SUPERVISION',
        status: 'COMPLETED',
        attachments: [],
        completedAt: '2024-03-16T15:00:00Z',
        completedBy: 'u2'
      }
    ],
    validatedAt: '2024-03-17T09:00:00Z',
    validatedBy: 'Admin CIRT Nord',
    createdBy: 'u2'
  }
];
