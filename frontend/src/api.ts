/**
 * api.ts — Couche d'accès au backend CIRT-ANTIC v3
 */

import type {
  User, Dossier, Category, Antenne, ServiceCirt, SousDirection,
  PermissionCategory, StatGlobale, StatAntenne, ActivityLog,
  DossierSyncRequest, SecurityLevel, ScanUrl, ScanResult, ScanStats, DocFile,
} from './types';

const BASE_URL: string = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080';

// ── Token ─────────────────────────────────────────────────────────────────────
let _token: string | null = localStorage.getItem('jwt_token');

export function setToken(t: string)  { _token = t; localStorage.setItem('jwt_token', t); }
export function clearToken()         { _token = null; localStorage.removeItem('jwt_token'); }
export function getToken(): string | null { return _token; }

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function http<T>(method: string, path: string, body?: unknown, isFormData = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) { clearToken(); window.dispatchEvent(new Event('app-logout')); throw new Error('Session expirée.'); }
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try { const e = await res.json(); msg = e.error ?? msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<User> {
  const data = await http<{ token: string; user: User }>('POST', '/auth/login', { email, password });
  setToken(data.token);
  return data.user;
}
export function logout() { clearToken(); }

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers       = (): Promise<User[]>  => http('GET', '/users');
export const getCurrentUser = (): Promise<User>    => http('GET', '/users/me');

export interface CreateUserPayload {
  name: string; email: string; password: string; roleName: string;
  antenneId?: number; serviceId?: number;
  sousDirectionId?: number; sousDirectionName?: string;
}
export const createUser = (p: CreateUserPayload): Promise<User> => http('POST', '/users', p);
export const deleteUser = (id: number): Promise<void> => http('DELETE', `/users/${id}`);

export const updateUserRole = (id: number, payload: { roleName?: string; antenneId?: number; serviceId?: number }): Promise<User> =>
  http('PUT', `/users/${id}/role`, payload);

export const toggleUserActive = (id: number, active: boolean): Promise<User> =>
  http('PUT', `/users/${id}/active`, { active });

export interface UpdateProfilePayload { name?: string; email?: string; password?: string; }
export const updateProfile = (p: UpdateProfilePayload): Promise<User> => http('PUT', '/users/me', p);

// ── DOSSIERS ──────────────────────────────────────────────────────────────────
export const getDossiers    = (): Promise<Dossier[]>     => http('GET', '/dossiers');
export const getDossierById = (id: number): Promise<Dossier> => http('GET', `/dossiers/${id}`);

export interface CreateDossierPayload {
  title: string; description?: string; categoryId: number; securityLevel?: SecurityLevel;
}
export const createDossier   = (p: CreateDossierPayload): Promise<Dossier> => http('POST', '/dossiers', p);
export const ouvrirDossier   = (id: number): Promise<Dossier> => http('PUT', `/dossiers/${id}/ouvrir`);
export const validateDossier = (id: number): Promise<Dossier> => http('PUT', `/dossiers/${id}/validate`);
export const stampDossier    = (id: number): Promise<Dossier> => http('PUT', `/dossiers/${id}/stamp`);
export const sealDossier     = (id: number): Promise<Dossier> => http('PUT', `/dossiers/${id}/seal`);
export const archiveDossier  = (id: number): Promise<Dossier> => http('PUT', `/dossiers/${id}/archive`);
export const deleteDossier   = (id: number): Promise<void>    => http('DELETE', `/dossiers/${id}`);
export const setDossierSecurity = (id: number, securityLevel: SecurityLevel): Promise<Dossier> =>
  http('PUT', `/dossiers/${id}/security`, { securityLevel });

// ── SYNC CIRT ─────────────────────────────────────────────────────────────────
export const requestSync   = (dossierId: number): Promise<DossierSyncRequest> =>
  http('POST', `/dossiers/${dossierId}/sync/request`);
export const getSyncRequests = (): Promise<DossierSyncRequest[]> =>
  http('GET', '/dossiers/sync/requests');
export const reviewSync = (reqId: number, approved: boolean, motif?: string): Promise<DossierSyncRequest> =>
  http('PUT', `/dossiers/sync/requests/${reqId}/review`, { approved, motif });

// ── CATÉGORIES ────────────────────────────────────────────────────────────────
export const getCategories   = (): Promise<Category[]>  => http('GET', '/categories');
export const createCategory  = (name: string): Promise<Category> => http('POST', '/categories', { name });
export const deleteCategory  = (id: number): Promise<void> => http('DELETE', `/categories/${id}`);
export const setCategorySecurity = (id: number, securityLevel: SecurityLevel): Promise<Category> =>
  http('PUT', `/categories/${id}/security`, { securityLevel });

export const getUserPermissions    = (userId: number): Promise<PermissionCategory[]> => http('GET', `/categories/user/${userId}`);
export const grantCategoryPermission  = (userId: number, categoryId: number): Promise<PermissionCategory> =>
  http('POST', '/categories/grant', { userId, categoryId });
export const revokeCategoryPermission = (userId: number, categoryId: number): Promise<void> =>
  http('DELETE', '/categories/revoke', { userId, categoryId });

export const getCategoryAntennes = (categoryId: number): Promise<Antenne[]> =>
  http('GET', `/categories/${categoryId}/antennes`);
export const addCategoryAntenne  = (categoryId: number, antenneId: number): Promise<void> =>
  http('POST', `/categories/${categoryId}/antennes`, { antenneId });
export const removeCategoryAntenne = (categoryId: number, antenneId: number): Promise<void> =>
  http('DELETE', `/categories/${categoryId}/antennes/${antenneId}`);

// ── ANTENNES ──────────────────────────────────────────────────────────────────
export const getAntennes   = (): Promise<Antenne[]> => http('GET', '/antennes');
export const createAntenne = (name: string): Promise<Antenne> => http('POST', '/antennes', { name });
export const deleteAntenne = (id: number): Promise<void> => http('DELETE', `/antennes/${id}`);

export const getAntenneCategories   = (antenneId: number): Promise<Category[]> =>
  http('GET', `/antennes/${antenneId}/categories`);
export const addAntenneCategory     = (antenneId: number, categoryId: number): Promise<void> =>
  http('POST', `/antennes/${antenneId}/categories`, { categoryId });
export const removeAntenneCategory  = (antenneId: number, categoryId: number): Promise<void> =>
  http('DELETE', `/antennes/${antenneId}/categories/${categoryId}`);

// ── ORGANISATION ──────────────────────────────────────────────────────────────
export const getSousDirections      = (): Promise<SousDirection[]> => http('GET', '/organisation/sous-directions');
export const getSousDirectionsLibres = (): Promise<SousDirection[]> => http('GET', '/organisation/sous-directions/libres');
export const createSousDirection    = (name: string): Promise<SousDirection> =>
  http('POST', '/organisation/sous-directions', { name });
export const updateSousDirection    = (id: number, name: string): Promise<SousDirection> =>
  http('PUT', `/organisation/sous-directions/${id}`, { name });
export const deleteSousDirection    = (id: number): Promise<void> =>
  http('DELETE', `/organisation/sous-directions/${id}`);

export const getServices    = (): Promise<ServiceCirt[]> => http('GET', '/organisation/services');
export const createService  = (name: string, description: string, sousDirectionId: number): Promise<ServiceCirt> =>
  http('POST', '/organisation/services', { name, description, sousDirectionId });
export const deleteService  = (id: number): Promise<void> =>
  http('DELETE', `/organisation/services/${id}`);

// ── LOGS ─────────────────────────────────────────────────────────────────────
export const getLogs          = (from?: string, to?: string): Promise<ActivityLog[]> => {
  const p = new URLSearchParams();
  if (from) p.set('from', from);
  if (to) p.set('to', to);
  return http('GET', `/logs?${p}`);
};
export const getMyLogs        = (): Promise<ActivityLog[]>  => http('GET', '/logs/me');
export const getUserLogs      = (userId: number): Promise<ActivityLog[]> => http('GET', `/logs/user/${userId}`);
export const getTargetLogs    = (type: string, id: number): Promise<ActivityLog[]> =>
  http('GET', `/logs/target/${type}/${id}`);

// ── STATISTIQUES ──────────────────────────────────────────────────────────────
export const getGlobalStats = (annee?: string, mois?: string): Promise<StatGlobale[]> => {
  const p = new URLSearchParams();
  if (annee) p.set('annee', annee);
  if (mois) p.set('mois', mois);
  return http('GET', `/stats/global?${p}`);
};
export const getStatsByAntenne = (categoryId?: number, annee?: string, mois?: string): Promise<StatAntenne[]> => {
  const p = new URLSearchParams();
  if (categoryId) p.set('categoryId', String(categoryId));
  if (annee) p.set('annee', annee);
  if (mois) p.set('mois', mois);
  return http('GET', `/stats/antennes?${p}`);
};

// ── ÉTAPES ────────────────────────────────────────────────────────────────────
export const createEtape = (dossierId: number, title: string, description: string) =>
  http('POST', `/etapes/${dossierId}`, { title, description });

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
export const getDossierDocuments = (dossierId: number): Promise<DocFile[]> =>
  http('GET', `/documents/dossier/${dossierId}`);
export const uploadToEtape = (etapeId: number, file: File): Promise<DocFile> => {
  const fd = new FormData(); fd.append('file', file);
  return http('POST', `/documents/${etapeId}`, fd, true);
};
export const deleteDocument = (id: number): Promise<void> => http('DELETE', `/documents/${id}`);
export const fileViewUrl = (fileUrl: string): string =>
  `${(import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080'}${fileUrl}`;
export const createEtapeForDoc = (dossierId: number): Promise<{ id: number }> =>
  http('POST', `/etapes/${dossierId}`, { title: 'Pièces jointes', description: 'Documents généraux' });

// ── SCANS ─────────────────────────────────────────────────────────────────────
export const addScanUrls   = (dossierId: number, urls: string): Promise<ScanUrl[]> =>
  http('POST', `/scans/${dossierId}/urls`, { urls });
export const getScanUrls   = (dossierId: number): Promise<ScanUrl[]> =>
  http('GET', `/scans/${dossierId}/urls`);
export const saveScanResult = (urlId: number, severity: string, rapport: string): Promise<ScanResult> =>
  http('POST', `/scans/urls/${urlId}/result`, { severity, rapport });
export const getScanStats  = (dossierId: number): Promise<ScanStats> =>
  http('GET', `/scans/${dossierId}/stats`);
