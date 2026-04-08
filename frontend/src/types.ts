/**
 * Types TypeScript — Plateforme CIRT-ANTIC
 * Alignés sur la hiérarchie exacte du backend v3.
 *
 * Hiérarchie :
 *   super_admin > directeur > admin_cirt > chef_service / agent_cirt
 *                           > directeur_antenne > agent_antenne
 */

// ── Rôles (7 rôles) ───────────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin'        // Rôle technique suprême — crée le directeur
  | 'directeur'          // Directeur CIRT — un seul actif, crée admin_cirt + directeur_antenne
  | 'admin_cirt'         // Sous-directeur CIRT — crée chef_service + agent_cirt
  | 'chef_service'       // Chef de service — supervision de son service
  | 'directeur_antenne'  // Directeur d'antenne — un seul actif par antenne
  | 'agent_cirt'         // Agent CIRT — traitement dossiers
  | 'agent_antenne';     // Agent antenne — création de dossiers

// ── Niveaux de sécurité ───────────────────────────────────────────────────────
export type SecurityLevel =
  | 'SECRET_PRIVE'    // Seul le créateur voit. Pas de sync possible.
  | 'ANTENNE_PRIVE'   // Directeur antenne + CIRT
  | 'ANTENNE_PUBLIC'  // Tous les agents de l'antenne (avec catégorie)
  | 'CIRT_ONLY'       // CIRT uniquement
  | 'PUBLIC';         // Tous avec la catégorie (défaut)

export const SECURITY_LEVEL_LABELS: Record<SecurityLevel, string> = {
  SECRET_PRIVE:   'Secret Privé',
  ANTENNE_PRIVE:  'Privé Antenne',
  ANTENNE_PUBLIC: 'Public Antenne',
  CIRT_ONLY:      'CIRT Uniquement',
  PUBLIC:         'Public',
};

// ── Statuts dossier ───────────────────────────────────────────────────────────
export type DossierStatus = 'EN_ATTENTE' | 'EN_COURS' | 'VALIDE' | 'ARCHIVE';

// ── Statuts demande sync ──────────────────────────────────────────────────────
export type SyncStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ── Hiérarchie CIRT ───────────────────────────────────────────────────────────
export interface SousDirection {
  id: number;
  name: string;
  directeur?: User;
  createdAt?: string;
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
  createdAt?: string;
}

// ── Utilisateur ───────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  antenne?: Antenne;
  service?: ServiceCirt;
  active?: boolean;
  createdAt?: string;
  // Flags calculés par le backend au login
  isSuperAdmin?: boolean;
  isDirecteur?: boolean;
  isTopLevel?: boolean;
}

// ── Catégorie ─────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  description?: string;
  securityLevel?: SecurityLevel;
  securitySetBy?: User;
  createdAt?: string;
}

// ── Permission catégorie ──────────────────────────────────────────────────────
export interface PermissionCategory {
  id: number;
  user: User;
  category: Category;
}

// ── Étape ─────────────────────────────────────────────────────────────────────
export interface Etape {
  id: number;
  title: string;
  description?: string;
  status: 'EN_COURS' | 'TERMINE';
  createdAt: string;
}

// ── Document ──────────────────────────────────────────────────────────────────
export interface DocFile {
  id: number;
  fileName: string;
  fileType?: string;
  fileUrl: string;
  uploadedBy?: { id: number; name: string };
  createdAt: string;
}

// ── Demande de synchronisation ────────────────────────────────────────────────
export interface DossierSyncRequest {
  id: number;
  dossier: Dossier;
  requestedBy: User;
  reviewedBy?: User;
  status: SyncStatus;
  motif?: string;
  requestedAt: string;
  reviewedAt?: string;
}

// ── Dossier ───────────────────────────────────────────────────────────────────
export interface Dossier {
  id: number;
  title: string;
  description?: string;
  status: DossierStatus;
  securityLevel: SecurityLevel;
  securitySetBy?: User;
  syncedToCirt: boolean;
  stamped: boolean;
  stampedBy?: User;
  stampedAt?: string;
  sealed: boolean;
  sealedBy?: User;
  sealedAt?: string;
  createdAt: string;
  validatedAt?: string;
  archivedAt?: string;
  category?: Category;
  antenne?: Antenne;
  service?: ServiceCirt;
  createdBy?: User;
  validatedBy?: User;
  archivedBy?: User;
}

// ── Journal d'activité ────────────────────────────────────────────────────────
export interface ActivityLog {
  id: number;
  actor?: User;
  action: string;
  description?: string;
  targetId?: number;
  targetType?: string;
  targetLabel?: string;
  createdAt: string;
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

// ── Scans ─────────────────────────────────────────────────────────────────────
export interface ScanUrl {
  id: number;
  url: string;
  status: 'EN_ATTENTE' | 'ANALYSEE' | 'ECHOUEE';
  createdAt: string;
  analyzedAt?: string;
}

export interface ScanResult {
  id: number;
  scanUrl: ScanUrl;
  severity: 'FAIBLE' | 'MOYEN' | 'ELEVE';
  rapport?: string;
  scannedAt: string;
}

export interface ScanStats {
  total: number;
  enAttente: number;
  analysees: number;
  echouees: number;
  vulnFaible: number;
  vulnMoyen: number;
  vulnEleve: number;
}

// ── Labels ────────────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:       'Super Administrateur',
  directeur:         'Directeur CIRT',
  admin_cirt:        'Sous-directeur CIRT',
  chef_service:      'Chef de Service',
  directeur_antenne: "Directeur d'Antenne",
  agent_cirt:        'Agent CIRT',
  agent_antenne:     'Agent Antenne',
};

// ── Helpers de rôle ───────────────────────────────────────────────────────────
export const isTopLevel    = (r: UserRole) => r === 'super_admin' || r === 'directeur';
export const isCirtMember  = (r: UserRole) => ['super_admin','directeur','admin_cirt','chef_service','agent_cirt'].includes(r);
export const isAntenneMember = (r: UserRole) => r === 'directeur_antenne' || r === 'agent_antenne';

/** Qui peut créer des utilisateurs */
export const canCreateUsers = (r: UserRole) =>
  ['super_admin','directeur','admin_cirt','directeur_antenne'].includes(r);

/** Quels rôles peut créer chaque rôle */
export const CREATABLE_ROLES: Record<string, UserRole[]> = {
  super_admin:       ['directeur'],
  directeur:         ['admin_cirt', 'directeur_antenne'],
  admin_cirt:        ['chef_service', 'agent_cirt'],
  directeur_antenne: ['agent_antenne'],
};

export const canCreateDossiers = (r: UserRole) => r === 'agent_antenne';
export const canValidate    = (r: UserRole) => isCirtMember(r);
export const canArchive     = (r: UserRole) => ['super_admin','directeur','admin_cirt','chef_service'].includes(r);
export const canStampOrSeal = (r: UserRole) => isTopLevel(r);
export const canViewStats   = (r: UserRole) => ['super_admin','directeur','admin_cirt','chef_service','directeur_antenne'].includes(r);
export const canManageCategories = (r: UserRole) => isTopLevel(r);
export const canManageAntennes   = (r: UserRole) => isTopLevel(r) || r === 'admin_cirt';
export const canViewLogs    = (r: UserRole) => ['super_admin','directeur','admin_cirt'].includes(r);

/** Peut configurer les niveaux de sécurité (pas les agents simples) */
export const canSetSecurity = (r: UserRole) =>
  !['agent_antenne','agent_cirt'].includes(r);

/** Peut approuver les demandes de sync */
export const canReviewSync = (r: UserRole) =>
  ['super_admin','directeur','admin_cirt','directeur_antenne'].includes(r);
