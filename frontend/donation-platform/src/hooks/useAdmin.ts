import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '../api/admin';

/**
 * 관리자 대시보드 데이터
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getAdminDashboard,
    // 1분마다 자동 갱신
    refetchInterval: 60000,
  });
}

/**
 * 관리자 - 전체 프로젝트 목록
 */
export function useAdminProjects(filters: adminApi.AdminProjectFilters = {}) {
  return useQuery({
    queryKey: ['admin-projects', filters],
    queryFn: () => adminApi.getAdminProjects(filters),
  });
}

/**
 * 관리자 - 전체 사용자 목록
 */
export function useAdminUsers(filters: adminApi.AdminUserFilters = {}) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminApi.getAdminUsers(filters),
  });
}

/**
 * 관리자 - 정산 요청 목록
 */
export function useAdminSettlements(filters: adminApi.AdminSettlementFilters = {}) {
  return useQuery({
    queryKey: ['admin-settlements', filters],
    queryFn: () => adminApi.getAdminSettlements(filters),
  });
}

/**
 * 통계 데이터
 */
export function useMetrics(period: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['metrics', period],
    queryFn: () => adminApi.getMetrics(period),
  });
}

/**
 * 카테고리별 분포
 */
export function useCategoryDistribution() {
  return useQuery({
    queryKey: ['category-distribution'],
    queryFn: adminApi.getCategoryDistribution,
  });
}

/**
 * 프로젝트 승인
 */
export function useApproveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.approveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

/**
 * 프로젝트 반려
 */
export function useRejectProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.rejectProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

/**
 * 사용자 상태 변경
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: 'active' | 'inactive' | 'suspended' }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

/**
 * 정산 승인
 */
export function useApproveSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.approveSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

/**
 * 정산 반려
 */
export function useRejectSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.rejectSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

/**
 * 정산 완료
 */
export function useCompleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.completeSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}
