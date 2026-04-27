import { apiUrl } from "./api-client";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "ACCOUNTANT" | "TUTOR" | "TUTE_MANAGER";

export type AuthResponse = {
  userId: number;
  username: string;
  name: string;
  role: UserRole;
  message: string;
};

export type ForgotPasswordResponse = {
  message: string;
  resetToken: string | null;
  expiresInMinutes: number | null;
};

export type ResetPasswordResponse = {
  message: string;
};

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export function signIn(username: string, password: string) {
  return request<AuthResponse>("/api/auth/signin", { username, password });
}

export function signUp(
  name: string,
  email: string,
  username: string,
  phoneNumber: string,
  password: string
) {
  return request<AuthResponse>("/api/auth/signup", {
    name,
    email,
    username,
    phoneNumber,
    password,
  });
}

export function requestPasswordReset(identifier: string) {
  return request<ForgotPasswordResponse>("/api/auth/forgot-password", { identifier });
}

export function resetPassword(token: string, newPassword: string) {
  return request<ResetPasswordResponse>("/api/auth/reset-password", { token, newPassword });
}
