export type Role = 'CIRT' | 'ANNEXE';

export type CategoryId = 
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

export interface User {
  id: string;
  name: string;
  role: Role;
  location?: string;
}
