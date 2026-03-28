/**
 * api.ts — Couche d'intégration entre le frontend SYNC ANTIC et le backend Spring Boot
 *
 * Mapping des types frontend → backend :
 *   UserRole frontend       → role.name backend
 *   SUPER_ADMIN             → super_admin
 *   CIRT_ADMIN              → admin_cirt
 *   CIRT_SECONDARY          → admin_cirt  (rôle étendu — mêmes droits, catégories limitées côté front)
 *   ANTENNE_DIRECTOR        → directeur_antenne
 *   ANTENNE_SIMPLE          → agent
 *
 *   DossierStatus frontend  → Status backend
 *   PENDING                 → EN_COURS
 *   VALIDATED               → VALIDE
 *   ARCHIVED                → ARCHIVE
 */

import { User, UserRole, Dossier, DossierStatus, Category, Antenne } from './types';

// URL du backend — configurée dans .env (VITE_API_URL=http://localhost:8080)
const BASE_URL: string = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080';

// ─── Token management ───────────────────────────────────────────────────────

let _token: string | null = localStorage.getItem('jwt_token');

export function setToken(t: string) {
  _token = t;
  localStorage.setItem('jwt_token', t);
}

export function clearToken() {
  _token = null;
  localStorage.removeItem('jwt_token');
}

export function getToken(): string | null {
  return _token;
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function http<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
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
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error ?? msg;
    } catch {/* ignore */}
    throw new Error(msg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Type mappers ─────────────────────────────────────────────────────────────

/** Backend role → frontend UserRole */
function mapRole(backendRole: string): UserRole {
  switch (backendRole) {
    case 'super_admin':        return 'SUPER_ADMIN';
    case 'admin_cirt':         return 'CIRT_ADMIN';
    case 'directeur_antenne':  return 'ANTENNE_DIRECTOR';
    case 'agent':              return 'ANTENNE_SIMPLE';
    default:                   return 'ANTENNE_SIMPLE';
  }
}

/** Frontend UserRole → backend role name */
function mapRoleToBackend(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':        return 'super_admin';
    case 'CIRT_ADMIN':
    case 'CIRT_SECONDARY':     return 'admin_cirt';
    case 'ANTENNE_DIRECTOR':   return 'directeur_antenne';
    case 'ANTENNE_SIMPLE':     return 'agent';
  }
}

/** Backend Status → frontend DossierStatus */
function mapStatus(backendStatus: string): DossierStatus {
  switch (backendStatus) {
    case 'VALIDE':   return 'VALIDATED';
    case 'ARCHIVE':  return 'ARCHIVED';
    default:         return 'PENDING';  // EN_COURS
  }
}

/** Frontend DossierStatus → backend Status */
function mapStatusToBackend(status: DossierStatus): string {
  switch (status) {
    case 'VALIDATED': return 'VALIDE';
    case 'ARCHIVED':  return 'ARCHIVE';
    default:          return 'EN_COURS';
  }
}

// ─── Backend raw types ────────────────────────────────────────────────────────

interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: { id: number; name: string };
  antenne?: { id: number; name: string };
  createdBy?: { id: number };
}

interface BackendDossier {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  validatedAt?: string;
  category?: { id: number; name: string };
  antenne?: { id: number; name: string };
  // createdBy is @JsonIgnore on backend, won't appear
}

interface BackendEtape {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  createdBy?: BackendUser;
  // documents fetched separately
}

interface BackendDocument {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  createdAt: string;
  uploadedBy?: BackendUser;
}

interface BackendCategory {
  id: number;
  name: string;
  createdBy?: BackendUser;
}

interface BackendAntenne {
  id: number;
  name: string;
}

// ─── Converters ───────────────────────────────────────────────────────────────

function toFrontendUser(b: BackendUser): User {
  const role = mapRole(b.role?.name ?? '');
  return {
    id: String(b.id),
    username: b.email,
    name: b.name,
    role,
    affiliation: (role === 'SUPER_ADMIN' || role === 'CIRT_ADMIN' || role === 'CIRT_SECONDARY')
      ? 'CIRT'
      : 'ANTENNE',
    antenneId: b.antenne ? String(b.antenne.id) : undefined,
    createdBy: b.createdBy ? String(b.createdBy.id) : undefined,
  };
}

function toFrontendDossier(b: BackendDossier): Dossier {
  const date = new Date(b.createdAt);
  return {
    id: String(b.id),
    title: b.title,
    description: b.description ?? '',
    categoryId: b.category ? String(b.category.id) : '',
    antenneId: b.antenne ? String(b.antenne.id) : '',
    antenneName: b.antenne?.name ?? '',
    createdAt: b.createdAt,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    status: mapStatus(b.status),
    attachments: [],   // chargés séparément via les étapes
    steps: [],         // chargés à la demande
    validatedAt: b.validatedAt,
    createdBy: '',     // @JsonIgnore côté backend
  };
}

function toFrontendCategory(b: BackendCategory): Category {
  return {
    id: String(b.id),
    label: b.name,
    icon: 'FileText',
  };
}

function toFrontendAntenne(b: BackendAntenne): Antenne {
  return {
    id: String(b.id),
    name: b.name,
    location: b.name.replace('Antenne ', ''),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Login — le backend attend { email, password }.
 * Le front utilise le champ "username" pour saisir l'email.
 */
export async function login(email: string, password: string): Promise<User> {
  const { token } = await http<{ token: string }>('POST', '/auth/login', { email, password });
  setToken(token);
  const me = await getCurrentUser();
  return me;
}

export async function getCurrentUser(): Promise<User> {
  const b = await http<BackendUser>('GET', '/users/me');
  return toFrontendUser(b);
}

// ─── Dossiers ────────────────────────────────────────────────────────────────

export async function getDossiers(): Promise<Dossier[]> {
  const b = await http<BackendDossier[]>('GET', '/dossiers/list');
  return b.map(toFrontendDossier);
}

export async function getDossiersFiltered(params: {
  antenneId?: string;
  categoryId?: string;
  status?: DossierStatus;
  start?: string;
  end?: string;
}): Promise<Dossier[]> {
  const q = new URLSearchParams();
  if (params.antenneId) q.set('antenneId', params.antenneId);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.status) q.set('status', mapStatusToBackend(params.status));
  if (params.start) q.set('start', params.start);
  if (params.end) q.set('end', params.end);

  const b = await http<BackendDossier[]>('GET', `/dossiers/filter?${q.toString()}`);
  return b.map(toFrontendDossier);
}

export async function createDossier(data: {
  title: string;
  description: string;
  categoryId: string;
}): Promise<Dossier> {
  const payload = {
    title: data.title,
    description: data.description,
    category: { id: Number(data.categoryId) },
  };
  const b = await http<BackendDossier>('POST', '/dossiers', payload);
  return toFrontendDossier(b);
}

export async function validateDossier(id: string): Promise<Dossier> {
  const b = await http<BackendDossier>('PUT', `/dossiers/${id}/validate`);
  return toFrontendDossier(b);
}

export async function archiveDossier(id: string): Promise<Dossier> {
  const b = await http<BackendDossier>('PUT', `/dossiers/${id}/archive`);
  return toFrontendDossier(b);
}

export async function getDossierStats(categoryId?: string): Promise<Record<string, Record<string, number>>> {
  const q = categoryId ? `?categoryId=${categoryId}` : '';
  return http('GET', `/dossiers/stats${q}`);
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

export async function getEtapes(dossierId: string) {
  return http<BackendEtape[]>('GET', `/etapes/dossier/${dossierId}`);
}

export async function createEtape(dossierId: string, data: { title: string; description: string }) {
  return http<BackendEtape>('POST', `/etapes/${dossierId}`, data);
}

// ─── Documents (upload fichier) ───────────────────────────────────────────────

export async function uploadDocument(etapeId: string, file: File): Promise<BackendDocument> {
  const form = new FormData();
  form.append('file', file);
  return http<BackendDocument>('POST', `/documents/${etapeId}`, form, true);
}

// ─── Catégories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const b = await http<BackendCategory[]>('GET', '/categories');
  return b.map(toFrontendCategory);
}

export async function createCategory(name: string): Promise<Category> {
  const b = await http<BackendCategory>('POST', '/categories', { name });
  return toFrontendCategory(b);
}

// ─── Antennes ─────────────────────────────────────────────────────────────────

export async function getAntennes(): Promise<Antenne[]> {
  // Le backend n'expose pas encore de endpoint GET /antennes public.
  // On utilise les données statiques comme fallback jusqu'à ce qu'il soit ajouté.
  try {
    const b = await http<BackendAntenne[]>('GET', '/antennes');
    return b.map(toFrontendAntenne);
  } catch {
    // Fallback sur les antennes statiques si l'endpoint n'existe pas
    return [
      { id: '1', name: 'Antenne Yaoundé',    location: 'Yaoundé' },
      { id: '2', name: 'Antenne Douala',     location: 'Douala' },
      { id: '3', name: 'Antenne Garoua',     location: 'Garoua' },
      { id: '4', name: 'Antenne Bafoussam',  location: 'Bafoussam' },
    ];
  }
}

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  roleId: number;
  antenneId?: number;
}): Promise<User> {
  const payload: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    password: data.password,
    role: { id: data.roleId },
  };
  if (data.antenneId) payload['antenne'] = { id: data.antenneId };

  const b = await http<BackendUser>('POST', '/users', payload);
  return toFrontendUser(b);
}

// ─── Export helpers ───────────────────────────────────────────────────────────

export { mapRoleToBackend, mapStatusToBackend, mapRole, mapStatus };
