import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/**
 * 기관 프로필 조회
 */
export function useOrganizationProfile() {
  return useQuery({
    queryKey: ['organization-profile'],
    queryFn: () => organizationApi.getOrganizationProfile(),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true,
  });
}

/**
 * 기관 프로필 수정 (소개글)
 */
export function useUpdateOrganizationProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: organizationApi.OrganizationProfileUpdateRequest) =>
      organizationApi.updateOrganizationProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
    },
  });
}

/**
 * 기관 프로필 이미지 수정
 */
export function useUpdateOrganizationProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileImage: File) =>
      organizationApi.updateOrganizationProfileImage(profileImage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
    },
  });
}
