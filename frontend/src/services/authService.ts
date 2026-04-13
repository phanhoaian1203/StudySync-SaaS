import axiosClient from './axiosClient';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

// ─────────────────────────────────────────────────────────────────
// Auth Service — Sử dụng centralized types từ src/types/index.ts
// ─────────────────────────────────────────────────────────────────
export const authService = {
  /**
   * Đăng nhập người dùng
   * POST /api/auth/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return await axiosClient.post<LoginRequest, AuthResponse>('/auth/login', data);
  },

  /**
   * Đăng ký người dùng
   * POST /api/auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return await axiosClient.post<RegisterRequest, AuthResponse>('/auth/register', data);
  },

  /**
   * Đăng xuất (Client-side cleanup)
   */
  logout: () => {
    localStorage.removeItem('studySync_token');
    localStorage.removeItem('studySync_user');
  }
};