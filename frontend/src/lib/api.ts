const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || "Error en la petición");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request("/api/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username: email, password }),
      }),
    register: (email: string, password: string, fullName?: string) =>
      request("/api/auth/register", {
        method: "POST",
        body: { email, password, full_name: fullName },
      }),
    me: (token: string) => request("/api/auth/me", { token }),
  },

  publications: {
    list: (token: string, status?: string) =>
      request(`/api/publications/${status ? `?status=${status}` : ""}`, { token }),
    get: (id: string, token: string) => request(`/api/publications/${id}`, { token }),
    create: (data: unknown, token: string) =>
      request("/api/publications/", { method: "POST", body: data, token }),
    update: (id: string, data: unknown, token: string) =>
      request(`/api/publications/${id}`, { method: "PATCH", body: data, token }),
    delete: (id: string, token: string) =>
      request(`/api/publications/${id}`, { method: "DELETE", token }),
    generate: (data: unknown, token: string) =>
      request("/api/publications/generate", { method: "POST", body: data, token }),
  },

  social: {
    listAccounts: (token: string) => request("/api/social/accounts", { token }),
    connectAccount: (data: unknown, token: string) =>
      request("/api/social/accounts", { method: "POST", body: data, token }),
    disconnectAccount: (id: string, token: string) =>
      request(`/api/social/accounts/${id}`, { method: "DELETE", token }),
    metaCallback: (code: string) => request(`/api/social/meta/callback?code=${code}`),
  },

  settings: {
    get: (token: string) => request("/api/settings/", { token }),
    update: (data: unknown, token: string) =>
      request("/api/settings/", { method: "PUT", body: data, token }),
  },

  publish: {
    generate: (data: unknown, token: string) =>
      request("/api/publish/generate", { method: "POST", body: data, token }),
    publish: (publicationId: string, token: string) =>
      request(`/api/publish/publication/${publicationId}`, { method: "POST", token }),
  },
};
