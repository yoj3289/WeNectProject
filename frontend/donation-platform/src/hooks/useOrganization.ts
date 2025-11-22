import { useQuery } from '@tanstack/react-query';
import * as organizationApi from '../api/organization';

/**
 * 기관 통계 조회
 */
export function useOrganizationStats() {
  return useQuery({
    queryKey: ['organization-stats'],
    queryFn: () => organizationApi.getOrganizationStats(),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true,
  });
}

/**
 * 기관 프로젝트 목록 조회
 */
export function useOrganizationProjects(filters: organizationApi.OrganizationProjectFilters = {}) {
  return useQuery({
    queryKey: ['organization-projects', filters],
    queryFn: () => organizationApi.getOrganizationProjects(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
