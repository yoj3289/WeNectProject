import { apiClient } from '../lib/apiClient';

// ==================== 응답 타입 ====================
export interface StatisticsSummaryResponse {
  totalProjects: number;
  totalDonors: number;
  totalDonationAmount: number;
  activeProjects: number;
  completedProjects: number;
}

// ==================== API 함수 ====================

/**
 * 전체 통계 요약 (홈페이지용)
 */
export const getStatisticsSummary = async (): Promise<StatisticsSummaryResponse> => {
  return apiClient.get<StatisticsSummaryResponse>('/statistics/summary');
};
