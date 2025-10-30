import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserType } from '../types';

interface User {
  userId: number;
  email: string;
  userName: string;
  userType: UserType;
  phone?: string;
  profileImageUrl?: string;
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
        set({
          isLoggedIn: true,
          user,
          token,
        });
      },

      // 로그아웃
      logout: () => {
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
    }),
    {
      name: 'auth-storage', // 로컬 스토리지 키
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
      }),
    }
  )
);
