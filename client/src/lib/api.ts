/** In dev, use Vite proxy (`/api` → server). In prod, use VITE_API_BASE_URL. */
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) return "";
  return String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalized}` : normalized;
}

export const API_BASE_URL = getApiBaseUrl();

export function apiFetch(input: RequestInfo, init?: RequestInit) {
  if (typeof input === "string" && input.startsWith("/api")) {
    return fetch(apiUrl(input), init);
  }
  return fetch(input, init);
}
