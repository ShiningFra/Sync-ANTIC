/**
 * Types TypeScript — Plateforme CIRT-ANTIC
 * Alignés exactement sur les rôles du backend (CDC §2-4)
 */

// ── Rôles (6 rôles conformes au CDC) ──────────────────────────────────────────
export type UserRole =
  | 'super_admin'        // Directeur du CIRT — accès total
  | 'admin_cirt'         // Sous-directeurs CIRT — gestion complète
  | 'chef_service'       // Chef de service CIRT — supervision de son service
  | 'directeur_antenne'  // Directeur d'une antenne régionale
  | 'agent_cirt'         // Agent CIRT — traitement, catégories assignées
  | 'agent_antenne';     // Agent antenne — création de dossiers

// ── Hiérarchie CIRT ───────────────────────────────────────────────────────────
export interface SousDirection {
  id: number;
  name: string;
}

export interface ServiceCirt {
  id: number;
  name: string;
  description?: string;
  sousDirection?: SousDirection;
}

// ── Antenne ───────────────────────────────────────────────────────────────────
export interface Antenne {
  id: number;
  name: string;
  location?: string;
}

// ── Utilisateur ───────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  antenne?: Antenne;         // Pour directeur_antenne et agent_antenne
  service?: ServiceCirt;     // Pour chef_service et agent_cirt
  active?: boolean;
}

// ── Catégorie ─────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  description?: string;
}

// ── Permission catégorie ───────────────────────────────────────────────────────
export interface PermissionCategory {
  id: number;
  user: User;
  category: Category;
}

// ── Statuts dossier ───────────────────────────────────────────────────────────
export type DossierStatus = 'EN_COURS' | 'VALIDE' | 'ARCHIVE';

// ── Étape ─────────────────────────────────────────────────────────────────────
export interface Etape {
  id: number;
  title: string;
  description?: string;
  status: 'EN_COURS' | 'TERMINE';
  createdAt: string;
  documents?: Document[];
}

// ── Document ──────────────────────────────────────────────────────────────────
export interface Document {
  id: number;
  name: string;
  path: string;
  size?: number;
  uploadedAt?: string;
}

// ── Dossier ───────────────────────────────────────────────────────────────────
export interface Dossier {
  id: number;
  title: string;
  description?: string;
  status: DossierStatus;
  createdAt: string;
  validatedAt?: string;
  archivedAt?: string;
  category?: Category;
  antenne?: Antenne;
  service?: ServiceCirt;
  createdBy?: User;
  validatedBy?: User;
  archivedBy?: User;
  etapes?: Etape[];
  documents?: Document[];
}

// ── Statistiques ──────────────────────────────────────────────────────────────
export interface StatGlobale {
  categoryId: number;
  categoryName: string;
  total: number;
  enCours: number;
  valides: number;
  archives: number;
}

export interface StatAntenne {
  antenneId: number;
  antenneName: string;
  total: number;
  enCours: number;
  valides: number;
  archives: number;
}

// ── Helpers de rôles ──────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:       'Directeur CIRT',
  admin_cirt:        'Sous-directeur CIRT',
  chef_service:      'Chef de Service',
  directeur_antenne: 'Directeur d\'Antenne',
  agent_cirt:        'Agent CIRT',
  agent_antenne:     'Agent Antenne',
};

export const isCirtMember = (role: UserRole): boolean =>
  ['super_admin', 'admin_cirt', 'chef_service', 'agent_cirt'].includes(role);

export const isAntenneMember = (role: UserRole): boolean =>
  ['directeur_antenne', 'agent_antenne'].includes(role);

export const canCreateUsers = (role: UserRole): boolean =>
  ['super_admin', 'admin_cirt', 'directeur_antenne'].includes(role);

export const canCreateDossiers = (role: UserRole): boolean =>
  role === 'agent_antenne';

export const canValidate = (role: UserRole): boolean =>
  ['super_admin', 'admin_cirt', 'chef_service'].includes(role);

export const canArchive = (role: UserRole): boolean =>
  ['super_admin', 'admin_cirt', 'chef_service'].includes(role);

export const canViewStats = (role: UserRole): boolean =>
  ['super_admin', 'admin_cirt', 'chef_service', 'directeur_antenne'].includes(role);

export const canManageCategories = (role: UserRole): boolean =>
  role === 'super_admin';

export const canManageAntennes = (role: UserRole): boolean =>
  ['super_admin', 'admin_cirt'].includes(role);

// Rôles que peut créer chaque rôle
export const CREATABLE_ROLES: Record<string, UserRole[]> = {
  super_admin:       ['admin_cirt'],
  admin_cirt:        ['chef_service', 'agent_cirt', 'directeur_antenne'],
  directeur_antenne: ['agent_antenne'],
};
