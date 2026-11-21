// Auth state management and API helpers
export interface User {
  id: string;
  email: string;
  name: string;
  preferred_language: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

const TOKEN_KEY = 'nagrik_auth_token';
const USER_KEY = 'nagrik_auth_user';

export function saveAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return { token: null, user: null };
  try {
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return { token: null, user: null };
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const { token } = loadAuth();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = '/api';

// ── Auth API ─────────────────────────────────────────────

export async function signupApi(email: string, name: string, password: string, preferred_language = 'en') {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password, preferred_language }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Signup failed');
  }
  return res.json() as Promise<{ token: string; user: User }>;
}

export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json() as Promise<{ token: string; user: User }>;
}

export async function getMeApi(): Promise<User | null> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return null;
  const res = await fetch(`${API_BASE}/auth/me`, { headers });
  if (!res.ok) return null;
  return res.json();
}

// ── Memory API ────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  key: string;
  label: string;
  value: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export async function fetchMemory(): Promise<MemoryEntry[]> {
  const res = await fetch(`${API_BASE}/memory`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function addMemoryEntry(key: string, value: string, source = 'manual'): Promise<MemoryEntry> {
  const res = await fetch(`${API_BASE}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ key, value, source }),
  });
  if (!res.ok) throw new Error('Failed to save memory');
  return res.json();
}

export async function updateMemoryEntry(id: string, value: string): Promise<MemoryEntry> {
  const res = await fetch(`${API_BASE}/memory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error('Failed to update memory');
  return res.json();
}

export async function deleteMemoryEntry(id: string): Promise<void> {
  await fetch(`${API_BASE}/memory/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
}

export async function clearAllMemory(): Promise<void> {
  await fetch(`${API_BASE}/memory`, { method: 'DELETE', headers: getAuthHeaders() });
}
