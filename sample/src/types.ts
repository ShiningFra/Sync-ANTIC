export type Role = 'CIRT' | 'ANNEXE';

export type View = 'LANDING' | 'DASHBOARD' | 'ADMIN_SETTINGS';

export type CategoryId = 
  | 'accueil'
  | 'scans-vulnerabilite'
  | 'fermeture-comptes'
  | 'veille-informationnelle'
  | 'collecte-actifs'
  | 'base-points-focaux'
  | 'requisitions'
  | 'authentification-preuves';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  description?: string;
}

export type DossierStatus = 'PENDING' | 'VALIDATED';

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface Dossier {
  id: string;
  title: string;
  description: string;
  categoryId: CategoryId;
  annexeId: string;
  annexeName: string;
  createdAt: string;
  status: DossierStatus;
  attachments: Attachment[];
  validatedAt?: string;
  validatedBy?: string;
}

export interface AnnexeAccount {
  id: string;
  name: string;
  annexeId: string; // The complex ID
  defaultPassword: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  annexeId?: string;
}
