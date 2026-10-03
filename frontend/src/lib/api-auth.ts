import { API_URL, setStoredToken } from "./api-token";
import type { LoginResponse } from "./api-types";

export type { LoginResponse };

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await fetch(`${API_URL}/auth/jwt/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    let errorDetail = "Login failed. Please check your credentials.";
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail =
          typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // Fallback message
    }
    throw new Error(errorDetail);
  }

  const data: LoginResponse = await response.json();
  setStoredToken(data.access_token);
  return data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Unable to request password reset.");
  }
}

export async function submitPasswordReset(
  token: string,
  password: string
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to reset password. The link may have expired.");
  }
}
