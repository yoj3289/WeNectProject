import { useQuery } from '@tanstack/react-query';
import * as statisticsApi from '../api/statistics';

/**
 * 전체 통계 요약 (홈페이지용)
 */
export function useStatisticsSummary() {
  return useQuery({
    queryKey: ['statistics-summary'],
    queryFn: statisticsApi.getStatisticsSummary,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== 기관 통계 훅 ====================

/**
 * 기관 전체 통계 요약 조회
 */
export function useOrganizationSummary() {
  return useQuery({
    queryKey: ['organization-statistics-summary'],
    queryFn: statisticsApi.getOrganizationSummary,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 기관 프로젝트 통계 목록 조회
 */
export function useOrganizationProjectStatistics() {
  return useQuery({
    queryKey: ['organization-project-statistics'],
    queryFn: statisticsApi.getOrganizationProjectStatistics,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 기관 프로젝트 기부 트렌드 조회
 */
export function useOrganizationDonationTrends(
  projectId?: number,
  period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
) {
  return useQuery({
    queryKey: ['organization-donation-trends', projectId, period],
    queryFn: () => statisticsApi.getOrganizationDonationTrends(projectId, period),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 특정 프로젝트 상세 통계 조회
 */
export function useOrganizationProjectDetailStatistics(projectId: number | null) {
  return useQuery({
    queryKey: ['organization-project-detail-statistics', projectId],
    queryFn: () => statisticsApi.getOrganizationProjectDetailStatistics(projectId!),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 사용자 기부 트렌드 조회
 */
export function useDonationTrends(period: 'monthly' | 'yearly', year?: number) {
  return useQuery({
    queryKey: ['donation-trends', period, year],
    queryFn: () => statisticsApi.getUserDonationTrends(period, year),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 사용자 카테고리 분석 조회
 */
export function useCategoryAnalysis() {
  return useQuery({
    queryKey: ['category-analysis'],
    queryFn: statisticsApi.getUserCategoryAnalysis,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 사용자 기부 타임라인 조회
 */
export function useDonationTimeline() {
  return useQuery({
    queryKey: ['donation-timeline'],
    queryFn: statisticsApi.getUserDonationTimeline,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 사용자 관심 카테고리 분포 조회
 */
export function useFavoriteCategoryDistribution() {
  return useQuery({
    queryKey: ['favorite-category-distribution'],
    queryFn: statisticsApi.getUserFavoriteCategoryDistribution,
    staleTime: 2 * 60 * 1000,
  });
}
