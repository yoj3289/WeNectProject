import { apiClient } from '../lib/apiClient';

// ==================== 타입 정의 ====================

export type ReportType = 'COMMENT' | 'POST' | 'PROJECT' | 'USER';

export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'
  | 'SPAM'
  | 'HARASSMENT'
  | 'FRAUD'
  | 'COPYRIGHT'
  | 'PERSONAL_INFO'
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

// 신고 사유 라벨
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  INAPPROPRIATE_CONTENT: '부적절한 콘텐츠',
  SPAM: '스팸',
  HARASSMENT: '괴롭힘/혐오',
  FRAUD: '사기/허위정보',
  COPYRIGHT: '저작권 침해',
  PERSONAL_INFO: '개인정보 노출',
  OTHER: '기타',
};

// 신고 상태 라벨
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: '대기중',
  UNDER_REVIEW: '검토중',
  RESOLVED: '처리완료',
  REJECTED: '반려됨',
};

// 신고 유형 라벨
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  COMMENT: '댓글',
  POST: '게시글',
  PROJECT: '프로젝트',
  USER: '사용자',
};

// ==================== 요청 타입 ====================

export interface CreateReportRequest {
  reportedItemId: number;
  reportType: ReportType;
  reason: ReportReason;
  description?: string;
}

export interface ProcessReportRequest {
  status: ReportStatus;
  adminNote?: string;
}

// ==================== 응답 타입 ====================

export interface ReportResponse {
  reportId: number;
  userId: number;
  reporterName: string;
  reportedUserId: number | null;
  reportedUserName: string | null;
  reportedItemId: number;
  reportedItemTitle: string;
  reportType: ReportType;
  reason: ReportReason;
  reasonLabel: string;
  description: string | null;
  status: ReportStatus;
  statusLabel: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface ReportListResponse {
  content: ReportResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export interface ReportStatsResponse {
  pendingCount: number;
  underReviewCount: number;
  resolvedCount: number;
  rejectedCount: number;
  todayCount: number;
}

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== API 함수 ====================

/**
 * 신고 생성
 */
export const createReport = async (request: CreateReportRequest): Promise<ReportResponse> => {
  const response = await apiClient.post<ApiResponseWrapper<ReportResponse>>('/reports', request);
  return response.data;
};

/**
 * 내 신고 목록 조회
 */
export const getMyReports = async (
  page: number = 0,
  size: number = 10
): Promise<ReportListResponse> => {
  const response = await apiClient.get<ApiResponseWrapper<ReportListResponse>>(
    `/reports/my?page=${page}&size=${size}`
  );
  return response.data;
};

/**
 * 신고 상세 조회
 */
export const getReport = async (reportId: number): Promise<ReportResponse> => {
  const response = await apiClient.get<ApiResponseWrapper<ReportResponse>>(`/reports/${reportId}`);
  return response.data;
};

/**
 * 신고 삭제 (본인의 대기 중인 신고만)
 */
export const deleteReport = async (reportId: number): Promise<void> => {
  await apiClient.delete(`/reports/${reportId}`);
};

// ==================== 관리자 API ====================

/**
 * 신고 목록 조회 (관리자)
 */
export const getAdminReports = async (
  status?: ReportStatus,
  reportType?: ReportType,
  page: number = 0,
  size: number = 10
): Promise<ReportListResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (reportType) params.append('reportType', reportType);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const response = await apiClient.get<ApiResponseWrapper<ReportListResponse>>(
    `/admin/reports?${params.toString()}`
  );
  return response.data;
};

/**
 * 신고 상세 조회 (관리자)
 */
export const getAdminReport = async (reportId: number): Promise<ReportResponse> => {
  const response = await apiClient.get<ApiResponseWrapper<ReportResponse>>(
    `/admin/reports/${reportId}`
  );
  return response.data;
};

/**
 * 신고 처리 (관리자)
 */
export const processReport = async (
  reportId: number,
  request: ProcessReportRequest
): Promise<ReportResponse> => {
  const response = await apiClient.put<ApiResponseWrapper<ReportResponse>>(
    `/admin/reports/${reportId}/process`,
    request
  );
  return response.data;
};

/**
 * 신고 통계 조회 (관리자)
 */
export const getReportStats = async (): Promise<ReportStatsResponse> => {
  const response = await apiClient.get<ApiResponseWrapper<ReportStatsResponse>>(
    '/admin/reports/stats'
  );
  return response.data;
};
