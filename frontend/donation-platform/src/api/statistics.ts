import { apiClient } from '../lib/apiClient';

// ==================== 응답 타입 ====================
export interface StatisticsSummaryResponse {
  totalProjects: number;
  totalDonors: number;
  totalDonationAmount: number;
  activeProjects: number;
  completedProjects: number;
}

/**
 * 기부 트렌드 응답 타입
 */
export interface DonationTrendResponse {
  period: string;
  totalAmount: number;
  donationCount: number;
}

/**
 * 카테고리 분석 응답 타입
 */
export interface CategoryAnalysisResponse {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  donationCount: number;
  percentage: number;
}

/**
 * 기부 타임라인 응답 타입
 */
export interface DonationTimelineResponse {
  donationId: number;
  donatedAt: string;
  amount: number;
  projectTitle: string;
  categoryId: number;
  categoryName: string;
}

/**
 * 관심 카테고리 분포 응답 타입
 */
export interface FavoriteCategoryDistributionResponse {
  categoryId: number;
  categoryName: string;
  projectCount: number;
  percentage: number;
}

// ==================== API 함수 ====================

/**
 * 전체 통계 요약 (홈페이지용)
 */
export const getStatisticsSummary = async (): Promise<StatisticsSummaryResponse> => {
  return apiClient.get<StatisticsSummaryResponse>('/statistics/summary');
};

/**
 * 사용자 기부 트렌드 조회
 */
export const getUserDonationTrends = async (
  period: 'monthly' | 'yearly',
  year?: number
): Promise<DonationTrendResponse[]> => {
  const params = new URLSearchParams({ period });
  if (year) params.append('year', year.toString());
  return apiClient.get<DonationTrendResponse[]>(`/statistics/user/donation-trends?${params.toString()}`);
};

/**
 * 사용자 카테고리 분석 조회
 */
export const getUserCategoryAnalysis = async (): Promise<CategoryAnalysisResponse[]> => {
  return apiClient.get<CategoryAnalysisResponse[]>('/statistics/user/category-analysis');
};

/**
 * 사용자 기부 타임라인 조회
 */
export const getUserDonationTimeline = async (): Promise<DonationTimelineResponse[]> => {
  return apiClient.get<DonationTimelineResponse[]>('/statistics/user/donation-timeline');
};

/**
 * 사용자 관심 카테고리 분포 조회
 */
export const getUserFavoriteCategoryDistribution = async (): Promise<FavoriteCategoryDistributionResponse[]> => {
  return apiClient.get<FavoriteCategoryDistributionResponse[]>('/statistics/user/favorite-category-distribution');
};

// ==================== 기관 통계 응답 타입 ====================

/**
 * 기관 전체 통계 요약 응답 타입
 */
export interface OrganizationStatisticsSummaryResponse {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  closedProjects: number;
  totalDonationAmount: number;
  totalDonorCount: number;
  totalDonationCount: number;
  averageDonation: number;
  averageAchievementRate: number;
}

/**
 * 개별 프로젝트 통계 응답 타입
 */
export interface ProjectStatisticsResponse {
  projectId: number;
  projectTitle: string;
  status: string;
  categoryId: number;
  categoryName: string;
  targetAmount: number;
  currentAmount: number;
  achievementRate: number;
  donorCount: number;
  donationCount: number;
  averageDonation: number;
  startDate: string;
  endDate: string;
}

/**
 * 프로젝트 기부 트렌드 응답 타입 (기관용)
 */
export interface ProjectDonationTrendResponse {
  period: string;
  totalAmount: number;
  donationCount: number;
  donorCount: number;
}

// ==================== 기관 통계 API 함수 ====================

/**
 * 기관 전체 통계 요약 조회
 */
export const getOrganizationSummary = async (): Promise<OrganizationStatisticsSummaryResponse> => {
  return apiClient.get<OrganizationStatisticsSummaryResponse>('/statistics/organization/summary');
};

/**
 * 기관 프로젝트 통계 목록 조회
 */
export const getOrganizationProjectStatistics = async (): Promise<ProjectStatisticsResponse[]> => {
  return apiClient.get<ProjectStatisticsResponse[]>('/statistics/organization/projects');
};

/**
 * 기관 프로젝트 기부 트렌드 조회
 */
export const getOrganizationDonationTrends = async (
  projectId?: number,
  period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
): Promise<ProjectDonationTrendResponse[]> => {
  const params = new URLSearchParams({ period });
  if (projectId) params.append('projectId', projectId.toString());
  return apiClient.get<ProjectDonationTrendResponse[]>(`/statistics/organization/donation-trends?${params.toString()}`);
};

/**
 * 특정 프로젝트 상세 통계 조회
 */
export const getOrganizationProjectDetailStatistics = async (
  projectId: number
): Promise<ProjectStatisticsResponse> => {
  return apiClient.get<ProjectStatisticsResponse>(`/statistics/organization/projects/${projectId}`);
};
