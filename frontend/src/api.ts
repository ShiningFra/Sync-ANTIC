/**
 * api.ts — Couche d'accès au backend Spring Boot
 * Les types correspondent exactement aux rôles du CDC.
 */

import type {
  User, Dossier, Category, Antenne, ServiceCirt,
  SousDirection, PermissionCategory, StatGlobale, StatAntenne
} from './types';

const BASE_URL: string = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080';

// ── Token ─────────────────────────────────────────────────────────────────────
let _token: string | null = localStorage.getItem('jwt_token');

export function setToken(t: string) {
  _token = t;
  localStorage.setItem('jwt_token', t);
}
export function clearToken() {
  _token = null;
  localStorage.removeItem('jwt_token');
}
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

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('app-logout'));
    throw new Error('Session expirée — veuillez vous reconnecter.');
  }
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try { const err = await res.json(); msg = err.error ?? msg; } catch {}
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

export function logout() {
  clearToken();
}

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers = (): Promise<User[]> => http('GET', '/users');
export const getCurrentUser = (): Promise<User> => http('GET', '/users/me');

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roleName: string;
  antenneId?: number;
  serviceId?: number;
}
export const createUser = (payload: CreateUserPayload): Promise<User> =>
  http('POST', '/users', payload);

export const deleteUser = (id: number): Promise<void> =>
  http('DELETE', `/users/${id}`);

// ── DOSSIERS ──────────────────────────────────────────────────────────────────
export const getDossiers = (): Promise<Dossier[]> => http('GET', '/dossiers');
export const getDossierById = (id: number): Promise<Dossier> => http('GET', `/dossiers/${id}`);

export interface CreateDossierPayload {
  title: string;
  description?: string;
  categoryId: number;
}
export const createDossier = (p: CreateDossierPayload): Promise<Dossier> =>
  http('POST', '/dossiers', p);

export const validateDossier = (id: number): Promise<Dossier> =>
  http('PUT', `/dossiers/${id}/validate`);

export const archiveDossier = (id: number): Promise<Dossier> =>
  http('PUT', `/dossiers/${id}/archive`);

export const deleteDossier = (id: number): Promise<void> =>
  http('DELETE', `/dossiers/${id}`);

// ── CATÉGORIES ────────────────────────────────────────────────────────────────
export const getCategories = (): Promise<Category[]> => http('GET', '/categories');

export const createCategory = (name: string): Promise<Category> =>
  http('POST', '/categories', { name });

export const deleteCategory = (id: number): Promise<void> =>
  http('DELETE', `/categories/${id}`);

export const getUserPermissions = (userId: number): Promise<PermissionCategory[]> =>
  http('GET', `/categories/user/${userId}`);

export const grantCategoryPermission = (userId: number, categoryId: number): Promise<PermissionCategory> =>
  http('POST', '/categories/grant', { userId, categoryId });

export const revokeCategoryPermission = (userId: number, categoryId: number): Promise<void> =>
  http('DELETE', '/categories/revoke', { userId, categoryId });

// ── ANTENNES ──────────────────────────────────────────────────────────────────
export const getAntennes = (): Promise<Antenne[]> => http('GET', '/antennes');

export const createAntenne = (name: string): Promise<Antenne> =>
  http('POST', '/antennes', { name });

export const deleteAntenne = (id: number): Promise<void> =>
  http('DELETE', `/antennes/${id}`);

// ── ORGANISATION CIRT ─────────────────────────────────────────────────────────
export const getSousDirections = (): Promise<SousDirection[]> =>
  http('GET', '/organisation/sous-directions');

export const getServices = (): Promise<ServiceCirt[]> =>
  http('GET', '/organisation/services');

export const createSousDirection = (name: string): Promise<SousDirection> =>
  http('POST', '/organisation/sous-directions', { name });

export const createService = (name: string, description: string, sousDirectionId: number): Promise<ServiceCirt> =>
  http('POST', '/organisation/services', { name, description, sousDirectionId });

// ── STATISTIQUES ──────────────────────────────────────────────────────────────
export const getGlobalStats = (annee?: string, mois?: string): Promise<StatGlobale[]> => {
  const params = new URLSearchParams();
  if (annee) params.set('annee', annee);
  if (mois) params.set('mois', mois);
  return http('GET', `/stats/global?${params}`);
};

export const getStatsByAntenne = (categoryId?: number, annee?: string, mois?: string): Promise<StatAntenne[]> => {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', String(categoryId));
  if (annee) params.set('annee', annee);
  if (mois) params.set('mois', mois);
  return http('GET', `/stats/antennes?${params}`);
};

// ── ÉTAPES ────────────────────────────────────────────────────────────────────
export const createEtape = (dossierId: number, title: string, description: string) =>
  http('POST', '/etapes', { dossierId, title, description });

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
export const uploadDocument = (etapeId: number, file: File): Promise<void> => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('etapeId', String(etapeId));
  return http('POST', '/documents/upload', fd, true);
};

// ── PROFIL ────────────────────────────────────────────────────────────────────
export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
}
export const updateProfile = (payload: UpdateProfilePayload): Promise<User> =>
  http('PUT', '/users/me', payload);
