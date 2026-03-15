import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { getToken } from "./stores/token.store";
import { PrivateRoute } from "./App";

vi.mock("./stores/token.store", () => ({
  getToken: vi.fn(),
}));

describe("PrivateRoute", () => {
  it("renders children when token exists", () => {
    vi.mocked(getToken).mockReturnValue("jwt-token");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div>Protected content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects to /login when no token", () => {
    vi.mocked(getToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div>Protected content</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
