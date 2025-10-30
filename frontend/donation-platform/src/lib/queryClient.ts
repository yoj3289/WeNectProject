import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 클라이언트 설정
 * - 캐싱 전략
 * - 재시도 정책
 * - 기본 옵션
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 윈도우 포커스 시 자동 재조회 비활성화
      refetchOnWindowFocus: false,

      // 실패 시 재시도 1회
      retry: 1,

      // 데이터가 "신선한" 상태로 유지되는 시간 (5분)
      staleTime: 5 * 60 * 1000,

      // 캐시 데이터 유지 시간 (10분)
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      // 뮤테이션 실패 시 재시도 안함
      retry: 0,
    },
  },
});
