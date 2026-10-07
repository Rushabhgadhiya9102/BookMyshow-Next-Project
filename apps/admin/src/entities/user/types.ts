export type UserRole = "admin" | "user";

export interface User {
  _id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type SafeUser = Omit<User, "password">;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupRequest extends LoginCredentials {
  username: string;
  confirmPassword: string;
  role: UserRole;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface LoginResponse {
  message: string;
  role: UserRole;
  token: string;
  status: number;
}

export interface SignupResponse {
  message: string;
  createUserData: User;
  status: number;
}

export interface LogoutResponse {
  message: string;
  status: number;
}
