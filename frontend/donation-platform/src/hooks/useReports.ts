import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';
import type { ReportStatus, ReportType, CreateReportRequest, ProcessReportRequest } from '../api/reports';

/**
 * 신고 생성
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reportsApi.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-stats'] });
    },
  });
}

/**
 * 내 신고 목록 조회
 */
export function useMyReports(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ['my-reports', page, size],
    queryFn: () => reportsApi.getMyReports(page, size),
  });
}

/**
 * 신고 상세 조회
 */
export function useReport(reportId: number) {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsApi.getReport(reportId),
    enabled: !!reportId,
  });
}

/**
 * 신고 삭제
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reportsApi.deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });
}

// ==================== 관리자용 Hooks ====================

/**
 * 관리자 신고 목록 조회
 */
export function useAdminReports(
  status?: ReportStatus,
  reportType?: ReportType,
  page: number = 0,
  size: number = 10
) {
  return useQuery({
    queryKey: ['admin-reports', status, reportType, page, size],
    queryFn: () => reportsApi.getAdminReports(status, reportType, page, size),
  });
}

/**
 * 관리자 신고 상세 조회
 */
export function useAdminReport(reportId: number) {
  return useQuery({
    queryKey: ['admin-report', reportId],
    queryFn: () => reportsApi.getAdminReport(reportId),
    enabled: !!reportId,
  });
}

/**
 * 신고 처리 (관리자)
 */
export function useProcessReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, request }: { reportId: number; request: ProcessReportRequest }) =>
      reportsApi.processReport(reportId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-report'] });
      queryClient.invalidateQueries({ queryKey: ['report-stats'] });
    },
  });
}

/**
 * 신고 통계 조회 (관리자)
 */
export function useReportStats() {
  return useQuery({
    queryKey: ['report-stats'],
    queryFn: reportsApi.getReportStats,
  });
}
