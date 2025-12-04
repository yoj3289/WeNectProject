import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserType } from '../types';
import { apiClient } from '../lib/apiClient';

interface User {
  userId: number;
  email: string;
  userName: string;
  userType: UserType;
  phone?: string;
  profileImageUrl?: string;
  organizationName?: string; // 기관명 (기관 사용자인 경우)
  createdAt?: string; // 가입일 (함께한 일수 계산용)
}

interface AuthState {
  // 상태
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;

  // 액션
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateToken: (token: string) => void; // 토큰 갱신용
}

/**
 * 인증 상태 관리 스토어
 * - Zustand + persist로 로컬 스토리지에 자동 저장
 * - 새로고침 후에도 로그인 상태 유지
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 초기 상태
      isLoggedIn: false,
      user: null,
      token: null,

      // 로그인
      login: (token, user) => {
        // 🔥 apiClient에 토큰 즉시 동기화 (페이지 새로고침 없이도 API 호출 가능하도록)
        apiClient.setToken(token);
        set({
          isLoggedIn: true,
          user,
          token,
        });
      },

      // 로그아웃
      logout: () => {
        // 🔥 apiClient 토큰 제거
        apiClient.clearToken();
        set({
          isLoggedIn: false,
          user: null,
          token: null,
        });
      },

      // 사용자 정보 업데이트
      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },

      // 토큰만 업데이트 (세션 연장용)
      updateToken: (token) => {
        // 🔥 apiClient에도 토큰 동기화
        apiClient.setToken(token);
        set({ token });
      },
    }),
    {
      name: 'auth-storage', // 로컬 스토리지 키
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
      }),
      // 🔥 localStorage에서 상태 복원 완료 후 토큰을 apiClient에 동기화
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      },
    }
  )
);
