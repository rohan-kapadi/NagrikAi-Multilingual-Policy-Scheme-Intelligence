export interface HealthStatus {
  status: string;
  app: string;
  environment: string;
  version: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}
