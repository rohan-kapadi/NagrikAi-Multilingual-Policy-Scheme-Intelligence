import type { ChatResponse, CitizenProfile, EligibilityResult, Scheme } from '../types';
import { getAuthHeaders } from './auth';

export interface HealthStatus {
  status: string;
  app: string;
  environment: string;
  version: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  language: string,
  userId?: string | null
): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      language,
      // Pass user_id so the backend loads persistent memory
      ...(userId ? { user_id: userId } : {}),
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Chat error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function resetSessionProfile(sessionId: string): Promise<void> {
  await fetch(`/api/chat/session/${sessionId}`, { method: 'DELETE' });
}

export async function fetchSchemes(category?: string, state?: string): Promise<Scheme[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (state) params.append('state', state);

  const res = await fetch(`/api/schemes?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch schemes');
  return res.json();
}

export async function checkEligibility(
  schemeId: string,
  profile: CitizenProfile,
  language = 'en'
): Promise<EligibilityResult> {
  const res = await fetch('/api/eligibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scheme_id: schemeId,
      profile: { ...profile, language }
    })
  });
  if (!res.ok) throw new Error('Eligibility check failed');
  return res.json();
}
