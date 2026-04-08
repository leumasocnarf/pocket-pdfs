import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw-server";
import { getToken, clearToken } from "../stores/token.store";
import api, { ApiError } from "./api";

vi.mock("../stores/token.store", () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("location", {
    href: "http://localhost/",
    origin: "http://localhost",
    pathname: "/",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const pathname = () =>
  new URL(window.location.href, "http://localhost").pathname;

describe("api", () => {
  describe("auth header", () => {
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

  describe("response handling", () => {
    it("returns parsed JSON for successful responses", async () => {
      vi.mocked(getToken).mockReturnValue(null);
      server.use(
        http.get("/api/ping", () => HttpResponse.json({ data: "ok" })),
      );

      const res = await api.get("/ping");

      expect(res).toEqual({ data: "ok" });
    });

    it("clears token and redirects to /login on 401", async () => {
      vi.mocked(getToken).mockReturnValue("expired-token");
      server.use(
        http.get("/api/ping", () => HttpResponse.json(null, { status: 401 })),
      );

      await expect(api.get("/ping")).rejects.toThrow(ApiError);

      expect(clearToken).toHaveBeenCalledOnce();
      expect(pathname()).toBe("/login");
    });

    it("rejects with ApiError without clearing token on non-401 errors", async () => {
      vi.mocked(getToken).mockReturnValue("valid-token");
      server.use(
        http.get("/api/ping", () => HttpResponse.json(null, { status: 500 })),
      );

      const error = await api.get("/ping").catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
      expect(clearToken).not.toHaveBeenCalled();
      expect(pathname()).toBe("/");
    });
  });
});
