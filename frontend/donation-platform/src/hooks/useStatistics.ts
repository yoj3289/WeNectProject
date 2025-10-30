import { useQuery } from '@tanstack/react-query';
import * as statisticsApi from '../api/statistics';

/**
 * 전체 통계 요약 (홈페이지용)
 */
export function useStatisticsSummary() {
  return useQuery({
    queryKey: ['statistics-summary'],
    queryFn: statisticsApi.getStatisticsSummary,
    // 5분간 캐시 유지
    staleTime: 5 * 60 * 1000,
  });
}
