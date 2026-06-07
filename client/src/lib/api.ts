export function apiUrl(path: string): string {
  const p = String(path || "").trim();
  if (!p) return p;

  // `vite` dev server proxy: /api -> backend
  if (p.startsWith("/api")) return p;

  // If someone passes full URL, keep it.
  if (/^https?:\/\//i.test(p)) return p;

  // Fallback to /api base.
  return `/api/${p.replace(/^\/?/, "")}`;
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

