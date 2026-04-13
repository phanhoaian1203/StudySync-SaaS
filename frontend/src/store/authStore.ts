import { create } from 'zustand';
import type { User, AuthResponse } from '../types';

// ─────────────────────────────────────────────────────────────────
// Storage keys — tập trung, tránh string magic
// ─────────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  TOKEN: 'studySync_token',
  USER:  'studySync_user',
} as const;

// ─────────────────────────────────────────────────────────────────
// State & Actions interface
// ─────────────────────────────────────────────────────────────────
interface AuthStore {
  // State
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;

  // Actions
  login:            (response: AuthResponse) => void;
  logout:           () => void;
  initFromStorage:  () => void;
}

// ─────────────────────────────────────────────────────────────────
// Zustand Store
// ─────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>((set) => ({
  // ── Initial state ────────────────────────────────────────────
  user:            null,
  token:           null,
  isAuthenticated: false,

  // ── login: gọi sau khi API trả về AuthResponse thành công ───
  login: (response: AuthResponse) => {
    const user: User = {
      userId:           response.userId,
      email:            response.email,
      fullName:         response.fullName,
      subscriptionPlan: response.subscriptionPlan,
    };

    // Lưu vào localStorage để persist qua refresh
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(user));

    set({
      user,
      token:           response.token,
      isAuthenticated: true,
    });
  },

  // ── logout: xóa sạch session ─────────────────────────────────
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    set({
      user:            null,
      token:           null,
      isAuthenticated: false,
    });
  },

  // ── initFromStorage: khôi phục session khi app khởi động lại ─
  // Gọi 1 lần duy nhất trong main.tsx (hoặc App.tsx)
  initFromStorage: () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const raw   = localStorage.getItem(STORAGE_KEYS.USER);

    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        // Dữ liệu bị corrupt → clear toàn bộ
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  },
}));
