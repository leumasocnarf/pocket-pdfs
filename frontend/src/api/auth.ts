import type { LoginResponse } from "../types";
import api from "./api";

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return api.postJson<LoginResponse>(
    "/auth/login",
    { username, password },
    { skipAuth: true },
  );
}
