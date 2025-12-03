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
