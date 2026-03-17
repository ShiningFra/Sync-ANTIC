export type UserRole = 
  | 'SUPER_ADMIN'      // Directeur du CIRT
  | 'CIRT_ADMIN'       // Admins inférieurs CIRT
  | 'CIRT_SECONDARY'   // Comptes secondaires CIRT
  | 'ANTENNE_DIRECTOR' // Directeur d'antenne
  | 'ANTENNE_SIMPLE';  // Compte simple antenne

export type AffiliationType = 'CIRT' | 'ANTENNE';

export type View = 'LANDING' | 'DASHBOARD' | 'ARCHIVES';

export type CategoryId = string;

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  description?: string;
  createdBy?: string;
}

export type DossierStatus = 'PENDING' | 'VALIDATED' | 'ARCHIVED';

export type StepActor = 'SUPERVISION' | 'REALIZATION';

export interface DossierStep {
  id: string;
  label: string;
  description: string;
  requiredFrom: StepActor;
  status: 'PENDING' | 'COMPLETED';
  attachments: Attachment[];
  completedAt?: string;
  completedBy?: string;
}

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
  antenneId: string;
  antenneName: string;
  createdAt: string; // ISO string
  year: number;
  month: number;
  day: number;
  status: DossierStatus;
  attachments: Attachment[]; // General attachments
  steps: DossierStep[];
  validatedAt?: string;
  validatedBy?: string;
  createdBy: string; // User ID
  archivedAt?: string;
  archivedBy?: string;
}

export interface Antenne {
  id: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  affiliation: AffiliationType;
  antenneId?: string; // If affiliation is ANTENNE
  allowedCategories?: CategoryId[]; // For CIRT_SECONDARY
  createdBy?: string; // Parent user ID
}
