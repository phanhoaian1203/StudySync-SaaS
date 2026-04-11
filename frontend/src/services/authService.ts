import axiosClient from './axiosClient';

// 1. Định nghĩa "Gói hàng" gửi đi (Giống hệt DTO C#)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

// 2. Định nghĩa "Gói hàng" nhận về
export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  subscriptionPlan: number; // 0 = Free, 1 = Pro
}

// 3. Khai báo các hàm gọi API
export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Gọi API POST /api/auth/login
    return await axiosClient.post<any, AuthResponse>('/auth/login', data);
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Gọi API POST /api/auth/register
    return await axiosClient.post<any, AuthResponse>('/auth/register', data);
  },

  logout: () => {
    // Xóa thẻ căn cước khi đăng xuất
    localStorage.removeItem('studySync_token');
    localStorage.removeItem('studySync_user');
  }
};