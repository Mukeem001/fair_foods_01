// API base URL - uses absolute URL in production, relative in dev
declare const __VITE_API_BASE_URL__: string;

// Determine API base URL at runtime as well as build time for safety
const getApiBase = (): string => {
  // Try build-time constant first
  if (typeof __VITE_API_BASE_URL__ !== "undefined" && __VITE_API_BASE_URL__) {
    return __VITE_API_BASE_URL__;
  }
  
  // Fallback: at runtime, if we're not on localhost, use absolute URL to Render
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1";
    if (!isLocalhost) {
      return "https://fair-foods-01.onrender.com/api";
    }
  }
  
  return "/api";
};

const API_BASE = getApiBase();

export function apiUrl(path: string): string {
  const p = String(path || "").trim();
  if (!p) return p;

  // If someone passes full URL, keep it.
  if (/^https?:\/\//i.test(p)) return p;

  // Strip leading /api if present (will be in API_BASE)
  const cleanPath = p.startsWith("/api") ? p.substring(4) : p;
  
  // Construct final URL
  const finalUrl = API_BASE.endsWith("/") 
    ? API_BASE + cleanPath.replace(/^\//, "")
    : API_BASE + (cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath);
  
  // Log for debugging (only in non-production)
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log("[apiUrl] Using API_BASE:", API_BASE, "Path:", path, "Final:", finalUrl);
  }
  
  return finalUrl;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = "";
    try {
      text = (await res.text()) || res.statusText;
      // Log first 500 chars of response for debugging
      if (text.length > 500) {
        console.error("[API Response] First 500 chars:", text.substring(0, 500));
      } else {
        console.error("[API Response]", text);
      }
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
  const finalUrl = apiUrl(url);
  console.log(`[apiFetch] Calling: ${finalUrl}`);
  
  const res = await fetch(finalUrl, {
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

