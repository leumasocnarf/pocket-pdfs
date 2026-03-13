import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw-server";
import { login } from "./auth";

const mockLoginResponse = {
  token: "jwt-token",
  user: { id: "1", username: "alice" },
};

describe("login", () => {
  it("returns login response on success", async () => {
    server.use(
      http.post("/auth/login", () => HttpResponse.json(mockLoginResponse)),
    );

    const result = await login("alice", "password123");
    expect(result).toEqual(mockLoginResponse);
  });

  it("sends correct credentials in request body", async () => {
    let body: unknown;
    server.use(
      http.post("/auth/login", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(mockLoginResponse);
      }),
    );

    await login("alice", "password123");
    expect(body).toEqual({ username: "alice", password: "password123" });
  });

  it("throws on failed request", async () => {
    server.use(
      http.post("/auth/login", () => HttpResponse.json(null, { status: 401 })),
    );

    await expect(login("alice", "wrong")).rejects.toThrow();
  });
});
