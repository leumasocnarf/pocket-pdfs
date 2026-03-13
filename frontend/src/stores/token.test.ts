import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken, isAuthenticated } from "./token.store";

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getToken", () => {
    it("returns null when no token is set", () => {
      expect(getToken()).toBeNull();
    });

    it("returns token after it has been set", () => {
      setToken("my-token");
      expect(getToken()).toBe("my-token");
    });
  });

  describe("setToken", () => {
    it("persists token so it can be retrieved", () => {
      setToken("my-token");
      expect(getToken()).toBe("my-token");
    });
  });

  describe("clearToken", () => {
    it("removes token so it can no longer be retrieved", () => {
      setToken("my-token");
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when no token is set", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true when token is set", () => {
      setToken("my-token");
      expect(isAuthenticated()).toBe(true);
    });
  });
});
