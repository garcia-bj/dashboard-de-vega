const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const isForm = body instanceof URLSearchParams;
  const headers: Record<string, string> = {
    "Content-Type": isForm ? "application/x-www-form-urlencoded" : "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? (isForm ? body.toString() : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || "Error en la petición");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ──
export interface UserOut {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  user: UserOut;
}

export interface PublicationOut {
  id: string;
  title: string;
  prompt: string;
  caption: string | null;
  ai_model: string;
  image_url: string | null;
  status: string;
  targets: string[];
  scheduled_at: string;
  published_at: string | null;
  created_at: string;
}

export interface SocialAccountOut {
  id: string;
  provider: string;
  page_id: string;
  page_name: string;
  instagram_business_id: string | null;
  is_active: boolean;
  token_expires_at: string | null;
}

export interface SettingsOut {
  full_name: string | null;
  email: string;
  logo: string | null;
  has_logo: boolean;
  reference_image: string | null;
  has_reference_image: boolean;
  gemini_configured: boolean;
  openai_configured: boolean;
  openrouter_configured: boolean;
}

export interface GenerateResult {
  image_url: string | null;
  model: string;
  raw_response: unknown | null;
}

// ── API ──
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<TokenOut>("/api/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username: email, password }),
      }),
    register: (email: string, password: string, fullName?: string) =>
      request<UserOut>("/api/auth/register", {
        method: "POST",
        body: { email, password, full_name: fullName },
      }),
    me: (token: string) => request<UserOut>("/api/auth/me", { token }),
  },

  publications: {
    list: (token: string, status?: string) =>
      request<PublicationOut[]>(
        `/api/publications/${status ? `?status=${status}` : ""}`,
        { token }
      ),
    get: (id: string, token: string) =>
      request<PublicationOut>(`/api/publications/${id}`, { token }),
    create: (data: unknown, token: string) =>
      request<PublicationOut>("/api/publications/", { method: "POST", body: data, token }),
    update: (id: string, data: unknown, token: string) =>
      request<PublicationOut>(`/api/publications/${id}`, { method: "PATCH", body: data, token }),
    delete: (id: string, token: string) =>
      request<void>(`/api/publications/${id}`, { method: "DELETE", token }),
    generate: (data: unknown, token: string) =>
      request<unknown>("/api/publications/generate", { method: "POST", body: data, token }),
  },

  social: {
    listAccounts: (token: string) =>
      request<SocialAccountOut[]>("/api/social/accounts", { token }),
    connectAccount: (data: unknown, token: string) =>
      request<SocialAccountOut>("/api/social/accounts", { method: "POST", body: data, token }),
    disconnectAccount: (id: string, token: string) =>
      request<void>(`/api/social/accounts/${id}`, { method: "DELETE", token }),
    metaCallback: (code: string) =>
      request<unknown>(`/api/social/meta/callback?code=${code}`),
  },

  settings: {
    get: (token: string) => request<SettingsOut>("/api/settings/", { token }),
    update: (data: unknown, token: string) =>
      request<SettingsOut>("/api/settings/", { method: "PUT", body: data, token }),
    uploadLogo: (file: File, token: string) => {
      const form = new FormData();
      form.append("file", file);
      return fetch(`${API_BASE}/api/settings/upload-logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }).then((r) => r.json() as Promise<{ logo: string }>);
    },
    uploadReference: (file: File, token: string) => {
      const form = new FormData();
      form.append("file", file);
      return fetch(`${API_BASE}/api/settings/upload-reference`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }).then((r) => r.json() as Promise<{ reference_image: string }>);
    },
  },

  publish: {
    generate: (data: unknown, token: string) =>
      request<GenerateResult>("/api/publish/generate", { method: "POST", body: data, token }),
    publish: (publicationId: string, token: string) =>
      request<unknown>(`/api/publish/publication/${publicationId}`, { method: "POST", token }),
  },
};
