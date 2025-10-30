import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/apiClient';
import * as authApi from '../api/auth';

/**
 * 인증 관련 훅
 * - 로그인, 로그아웃, 회원가입
 * - 토큰 관리 자동화
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { isLoggedIn, user, login: setLogin, logout: setLogout } = useAuthStore();

  /**
   * 로그인 뮤테이션
   */
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Zustand 스토어 업데이트
      setLogin(data.token, data.user);

      // API 클라이언트에 토큰 설정
      apiClient.setToken(data.token);

      // 쿼리 캐시 무효화 (새로운 사용자 데이터로 갱신)
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      console.error('로그인 실패:', error);
      throw error;
    },
  });

  /**
   * 회원가입 뮤테이션
   */
  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      // 회원가입 성공 시 자동 로그인
      setLogin(data.token, data.user);
      apiClient.setToken(data.token);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      console.error('회원가입 실패:', error);
      throw error;
    },
  });

  /**
   * 로그아웃 뮤테이션
   */
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Zustand 스토어 초기화
      setLogout();

      // API 클라이언트 토큰 제거
      apiClient.clearToken();

      // 쿼리 캐시 초기화
      queryClient.clear();
    },
    onError: (error: any) => {
      // 에러가 발생해도 로컬 상태는 초기화
      console.error('로그아웃 실패:', error);
      setLogout();
      apiClient.clearToken();
      queryClient.clear();
    },
  });

  /**
   * 비밀번호 변경 뮤테이션
   */
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onError: (error: any) => {
      console.error('비밀번호 변경 실패:', error);
      throw error;
    },
  });

  /**
   * 이메일 중복 확인
   */
  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const available = await authApi.checkEmailAvailability(email);
      return available;
    } catch (error) {
      console.error('이메일 중복 확인 실패:', error);
      throw error;
    }
  };

  return {
    // 상태
    isLoggedIn,
    user,

    // 액션
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutateAsync,
    checkEmailAvailability,

    // 로딩 상태
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,

    // 에러
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    changePasswordError: changePasswordMutation.error,
  };
}
