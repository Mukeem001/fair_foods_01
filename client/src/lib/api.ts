export const API_BASE_URL =
  String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiFetch(input: RequestInfo, init?: RequestInit) {
  if (typeof input === "string" && input.startsWith("/api") && API_BASE_URL) {
    return fetch(`${API_BASE_URL}${input}`, init);
  }
  return fetch(input, init);
}
