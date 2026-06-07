// API base URL - uses absolute URL in production, relative in dev
declare const __VITE_API_BASE_URL__: string;
const API_BASE = typeof __VITE_API_BASE_URL__ !== "undefined" ? __VITE_API_BASE_URL__ : "/api";

export function apiUrl(path: string): string {
  const p = String(path || "").trim();
  if (!p) return p;

  // If someone passes full URL, keep it.
  if (/^https?:\/\//i.test(p)) return p;

  // Already starts with /api, prepend base URL if absolute
  if (p.startsWith("/api")) {
    return API_BASE.includes("://") ? API_BASE.replace(/\/api\/?$/, "") + p : p;
  }

  // Fallback to base URL
  const base = API_BASE.includes("://") ? API_BASE : API_BASE;
  return base + (base.endsWith("/") ? "" : "/") + p.replace(/^\/?/, "");
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = "";
    try {
      text = (await res.text()) || res.statusText;
    } catch {
      text = res.statusText;
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      // If body is provided and no content-type, assume JSON.
      ...(options.body && !options.headers && { "Content-Type": "application/json" }),
    },
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

