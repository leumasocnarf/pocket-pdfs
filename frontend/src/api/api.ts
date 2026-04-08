import { getToken, clearToken } from "../stores/token.store.ts";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Request failed: ${status}`);
    this.status = status;
    this.body = body;
  }
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.body);
      return parsed.message ?? fallback;
    } catch {
      return fallback;
    }
  }
  return "An unexpected error occurred.";
}

type ApiOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const token = getToken();
  const headers = new Headers(fetchOptions.headers || {});

  if (token && !skipAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api${url}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuth) {
    clearToken();
    window.location.href = "/login";
    return Promise.reject(new ApiError(401, "Unauthorized"));
  }

  if (!response.ok) {
    const text = await response.text();
    return Promise.reject(new ApiError(response.status, text));
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

const api = {
  get: <T>(url: string, options?: ApiOptions) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body?: BodyInit, options?: ApiOptions) =>
    request<T>(url, { ...options, method: "POST", body }),

  postJson: <T>(url: string, body: unknown, options?: ApiOptions) =>
    request<T>(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(body),
    }),

  delete: <T = void>(url: string, options?: ApiOptions) =>
    request<T>(url, { ...options, method: "DELETE" }),
};

export default api;
