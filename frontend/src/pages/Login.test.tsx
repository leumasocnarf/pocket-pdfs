import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw-server";
import { setToken } from "../stores/token.store";
import Login from "./Login";
import * as auth from "../api/auth";

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../stores/token.store", () => ({
  setToken: vi.fn(),
}));

const mockLoginResponse = { token: "jwt-token" };

function renderLogin() {
  return render(<Login />);
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form interactions", () => {
    it("renders username and password inputs and a submit button", () => {
      renderLogin();

      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign in" }),
      ).toBeInTheDocument();
    });

    it("updates fields as user types", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "password123");

      expect(screen.getByLabelText("Username")).toHaveValue("alice");
      expect(screen.getByLabelText("Password")).toHaveValue("password123");
    });

    it("disables submit button and shows loading text while submitting", async () => {
      const user = userEvent.setup();
      server.use(
        http.post("/auth/login", async () => {
          await new Promise((r) => setTimeout(r, 100));
          return HttpResponse.json(mockLoginResponse);
        }),
      );
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      expect(
        screen.getByRole("button", { name: "Signing in..." }),
      ).toBeDisabled();
    });
  });

  describe("successful login", () => {
    it("stores token and navigates to home on success", async () => {
      const user = userEvent.setup();
      server.use(
        http.post("/auth/login", () => HttpResponse.json(mockLoginResponse)),
      );
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(setToken).toHaveBeenCalledWith("jwt-token");
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("error handling", () => {
    it("shows server error message on 401", async () => {
      const user = userEvent.setup();
      server.use(
        http.post("/auth/login", () =>
          HttpResponse.json(
            { message: "Invalid username or password" },
            { status: 401 },
          ),
        ),
      );
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "wrongpassword");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      expect(
        await screen.findByText("Invalid username or password"),
      ).toBeInTheDocument();
    });

    it("shows fallback message when server returns no message", async () => {
      const user = userEvent.setup();
      server.use(
        http.post("/auth/login", () =>
          HttpResponse.json(null, { status: 401 }),
        ),
      );
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "wrongpassword");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      expect(
        await screen.findByText("Invalid username or password"),
      ).toBeInTheDocument();
    });

    it("shows generic message on unexpected error", async () => {
      const user = userEvent.setup();
      vi.spyOn(auth, "login").mockRejectedValueOnce(new Error("Unexpected"));
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "wrongpassword");
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      expect(
        await screen.findByText("An unexpected error occurred"),
      ).toBeInTheDocument();
    });

    it("clears previous error on new submission", async () => {
      const user = userEvent.setup();
      server.use(
        http.post("/auth/login", () =>
          HttpResponse.json(null, { status: 401 }),
        ),
      );
      renderLogin();

      await user.type(screen.getByLabelText("Username"), "alice");
      await user.type(screen.getByLabelText("Password"), "wrong");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await screen.findByText("Invalid username or password");

      server.use(
        http.post("/auth/login", () => HttpResponse.json(mockLoginResponse)),
      );
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(
          screen.queryByText("Invalid username or password"),
        ).not.toBeInTheDocument();
      });
    });
  });
});
