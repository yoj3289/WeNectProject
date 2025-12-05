import { useQuery } from '@tanstack/react-query';
import * as organizationApi from '../api/organization';

/**
 * 기관 목록 조회
 */
export function useOrganizations(filters: organizationApi.OrganizationFilters = {}) {
  return useQuery({
    queryKey: ['organizations', filters],
    queryFn: () => organizationApi.getOrganizations(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * 특정 기관의 프로젝트 목록 조회
 */
export function useOrganizationProjects(
  orgId: number,
  filters: organizationApi.OrganizationProjectFilters = {}
) {
  return useQuery({
    queryKey: ['organization-projects', orgId, filters],
    queryFn: () => organizationApi.getOrganizationProjectsById(orgId, filters),
    enabled: !!orgId, // orgId가 있을 때만 실행
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * 기관 통계 조회 (기관 회원 전용)
 */
export function useOrganizationStats() {
  return useQuery({
    queryKey: ['organization-stats'],
    queryFn: organizationApi.getOrganizationStats,
    staleTime: 1 * 60 * 1000, // 1분간 캐시
    refetchOnWindowFocus: true,
  });
}

/**
 * 기관 소유 프로젝트 목록 조회 (기관 회원 전용)
 */
export function useMyOrganizationProjects(
  filters: organizationApi.OrganizationProjectFilters = {}
) {
  return useQuery({
    queryKey: ['my-organization-projects', filters],
    queryFn: () => organizationApi.getOrganizationProjects(filters),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
