import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw-server";
import { getToken, clearToken } from "../stores/token.store";
import api from "./api";

vi.mock("../stores/token.store", () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}));

const pathname = () => new URL(window.location.href).pathname;

describe("api interceptors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "/";
  });

  describe("request interceptor", () => {
    it("attaches Authorization header when token exists", async () => {
      vi.mocked(getToken).mockReturnValue("test-token");

      let authHeader: string | null = null;
      server.use(
        http.get("/api/ping", ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return HttpResponse.json({});
        }),
      );

      await api.get("/ping");
      expect(authHeader).toBe("Bearer test-token");
    });

    it("omits Authorization header when no token", async () => {
      vi.mocked(getToken).mockReturnValue(null);

      let authHeader: string | null = null;
      server.use(
        http.get("/api/ping", ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return HttpResponse.json({});
        }),
      );

      await api.get("/ping");
      expect(authHeader).toBeNull();
    });
  });

  describe("response interceptor", () => {
    it("passes through successful responses", async () => {
      vi.mocked(getToken).mockReturnValue(null);
      server.use(
        http.get("/api/ping", () => HttpResponse.json({ data: "ok" })),
      );

      const res = await api.get("/ping");
      expect(res.data).toEqual({ data: "ok" });
    });

    it("clears token and redirects to /login on 401", async () => {
      vi.mocked(getToken).mockReturnValue("expired-token");
      server.use(
        http.get("/api/ping", () => HttpResponse.json(null, { status: 401 })),
      );

      await expect(api.get("/ping")).rejects.toThrow();

      expect(clearToken).toHaveBeenCalledOnce();
      expect(pathname()).toBe("/login");
    });

    it("rejects without clearing token on non-401 errors", async () => {
      vi.mocked(getToken).mockReturnValue("valid-token");
      server.use(
        http.get("/api/ping", () => HttpResponse.json(null, { status: 500 })),
      );

      await expect(api.get("/ping")).rejects.toThrow();

      expect(clearToken).not.toHaveBeenCalled();
      expect(pathname()).toBe("/");
    });
  });
});
