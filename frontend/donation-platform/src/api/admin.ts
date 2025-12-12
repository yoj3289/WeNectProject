import { apiClient } from '../lib/apiClient';
import type { Project } from '../types';

// ==================== 요청 타입 ====================
export interface AdminProjectFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  category?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface AdminUserFilters {
  userType?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface OrganizationApprovalFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ApproveOrganizationRequest {
  userId: number;
  approvalNote?: string;
}

export interface RejectOrganizationRequest {
  userId: number;
  rejectionReason: string;
  rejectionFields?: string;
}

export interface AdminSettlementFilters {
  status?: 'all' | 'pending' | 'approved' | 'completed' | 'rejected';
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ApproveProjectRequest {
  projectId: number;
  approvalNote?: string;
}

export interface RejectProjectRequest {
  projectId: number;
  rejectionReason: string;
}

export interface ApproveSettlementRequest {
  settlementId: number;
  approvalNote?: string;
}

export interface RejectSettlementRequest {
  settlementId: number;
  rejectionReason: string;
}

// ==================== 응답 타입 ====================
export interface AdminDashboardResponse {
  todayDonation: number;
  donationChange: number;
  newUsers: number;
  userChange: number;
  pendingApprovals: number;
  pendingSettlements: number;
  pendingExpenses: number;
}

export interface CategoryDistributionResponse {
  name: string;
  count: number;
  percent: number;
  color: string;
}

export interface AdminUserResponse {
  userId: number;
  userName: string;
  email: string;
  userType: string;
  status: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  organizationName?: string;
  verified?: boolean;
}

export interface UserStatisticsResponse {
  totalDonationAmount: number;
  donationCount: number;
  participatedProjects: number;
}

export interface ActivityLogResponse {
  logId: number;
  activityType: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface OrganizationDocument {
  docId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  docType: string;
  uploadedAt: string;
}

export interface OrganizationApprovalResponse {
  id: number;
  userId: number;
  userName: string;
  email: string;
  phone: string;
  organizationName: string;
  businessNumber: string;
  representativeName: string;
  documents: OrganizationDocument[];
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  processedDate?: string;
  rejectionReason?: string;
}

export interface MetricsResponse {
  daily?: {
    date: string;
    newUsers: number;
    newProjects: number;
    totalDonations: number;
    donationCount: number;
  }[];
  weekly?: {
    weekStart: string;
    totalDonations: number;
    avgDonation: number;
    newProjects: number;
  }[];
  monthly?: {
    month: string;
    totalDonations: number;
    newUsers: number;
    completedProjects: number;
  }[];
}

// ==================== API 함수 ====================

/**
 * 관리자 대시보드 데이터
 */
export const getAdminDashboard = async (): Promise<{ data: AdminDashboardResponse }> => {
  return apiClient.get<{ data: AdminDashboardResponse }>('/admin/dashboard');
};

/**
 * 관리자 - 전체 프로젝트 목록
 */
export const getAdminProjects = async (
  filters: AdminProjectFilters = {}
): Promise<{ content: Project[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/admin/projects?${params.toString()}`);
};

/**
 * 프로젝트 승인
 */
export const approveProject = async (data: ApproveProjectRequest): Promise<void> => {
  return apiClient.put<void>(`/admin/projects/${data.projectId}/approve`, data);
};

/**
 * 프로젝트 반려
 */
export const rejectProject = async (data: RejectProjectRequest): Promise<void> => {
  return apiClient.put<void>(`/admin/projects/${data.projectId}/reject`, data);
};

/**
 * 관리자 - 전체 사용자 목록
 */
export const getAdminUsers = async (
  filters: AdminUserFilters = {}
): Promise<{ content: AdminUserResponse[]; totalPages: number; currentPage: number; totalElements: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<{ data: any }>(`/admin/users?${params.toString()}`);
  return response.data;
};

/**
 * 사용자 상태 변경
 */
export const updateUserStatus = async (
  userId: number,
  status: 'active' | 'inactive' | 'suspended'
): Promise<void> => {
  return apiClient.put<void>(`/admin/users/${userId}/status`, { status });
};

/**
 * 사용자별 활동 통계 조회
 */
export const getUserStatistics = async (userId: number): Promise<{ data: UserStatisticsResponse }> => {
  return apiClient.get<{ data: UserStatisticsResponse }>(`/admin/users/${userId}/statistics`);
};

/**
 * 사용자별 활동 로그 조회
 */
export const getUserActivityLogs = async (userId: number): Promise<{ data: ActivityLogResponse[] }> => {
  return apiClient.get<{ data: ActivityLogResponse[] }>(`/admin/users/${userId}/activity-logs`);
};

// ==================== 정산 응답 타입 ====================
export interface SettlementDocument {
  documentId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  documentType: string;
  uploadedAt: string;
}

export interface SettlementResponse {
  settlementId: number;
  projectId: number;
  projectTitle: string;
  piggyId: number | null;
  settlementAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  rejectionReason: string | null;
  adminMemo: string | null;
  documents: SettlementDocument[];
}

/**
 * 관리자 - 상태별 정산 목록 조회
 */
export const getSettlementsByStatus = async (
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'all'
): Promise<{ data: SettlementResponse[] }> => {
  if (status === 'all') {
    // 모든 상태를 가져와서 합치기
    const [pending, approved, completed, rejected] = await Promise.all([
      apiClient.get<{ data: SettlementResponse[] }>('/settlement-requests/status/PENDING'),
      apiClient.get<{ data: SettlementResponse[] }>('/settlement-requests/status/APPROVED'),
      apiClient.get<{ data: SettlementResponse[] }>('/settlement-requests/status/COMPLETED'),
      apiClient.get<{ data: SettlementResponse[] }>('/settlement-requests/status/REJECTED'),
    ]);
    return {
      data: [
        ...(pending.data || []),
        ...(approved.data || []),
        ...(completed.data || []),
        ...(rejected.data || []),
      ],
    };
  }
  return apiClient.get<{ data: SettlementResponse[] }>(`/settlement-requests/status/${status}`);
};

/**
 * 정산 상세 조회
 */
export const getSettlementDetail = async (settlementId: number): Promise<{ data: SettlementResponse }> => {
  return apiClient.get<{ data: SettlementResponse }>(`/settlement-requests/${settlementId}`);
};

/**
 * 정산 승인
 */
export const approveSettlement = async (data: ApproveSettlementRequest): Promise<{ data: SettlementResponse }> => {
  return apiClient.post<{ data: SettlementResponse }>(`/settlement-requests/${data.settlementId}/approve`, {
    adminMemo: data.approvalNote || '',
  });
};

/**
 * 정산 반려
 */
export const rejectSettlement = async (data: RejectSettlementRequest): Promise<{ data: SettlementResponse }> => {
  return apiClient.post<{ data: SettlementResponse }>(`/settlement-requests/${data.settlementId}/reject`, {
    rejectionReason: data.rejectionReason,
  });
};

/**
 * 대기 중인 정산 개수 조회
 */
export const getPendingSettlementCount = async (): Promise<{ data: number }> => {
  return apiClient.get<{ data: number }>('/settlement-requests/pending/count');
};

/**
 * 통계 데이터 조회
 */
export const getMetrics = async (
  period: 'daily' | 'weekly' | 'monthly'
): Promise<MetricsResponse> => {
  return apiClient.get<MetricsResponse>(`/admin/metrics/${period}`);
};

/**
 * 카테고리별 분포
 */
export const getCategoryDistribution = async (): Promise<{ data: CategoryDistributionResponse[] }> => {
  return apiClient.get<{ data: CategoryDistributionResponse[] }>('/admin/metrics/category-distribution');
};

/**
 * 기관 회원가입 승인 대기 목록
 */
export const getOrganizationApprovals = async (
  filters: OrganizationApprovalFilters = {}
): Promise<{ content: OrganizationApprovalResponse[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/admin/organizations/approvals?${params.toString()}`);
};

/**
 * 기관 회원가입 승인
 */
export const approveOrganization = async (data: ApproveOrganizationRequest): Promise<void> => {
  return apiClient.put<void>(`/admin/organizations/${data.userId}/approve`, data);
};

/**
 * 기관 회원가입 거절
 */
export const rejectOrganization = async (data: RejectOrganizationRequest): Promise<void> => {
  return apiClient.put<void>(`/admin/organizations/${data.userId}/reject`, data);
};

/**
 * 관리자 - 정산 목록 조회 (필터링 지원)
 */
export const getAdminSettlements = async (
  filters: AdminSettlementFilters = {}
): Promise<{ content: SettlementResponse[]; totalPages: number; currentPage: number }> => {
  const status = filters.status || 'all';
  const response = await getSettlementsByStatus(
    status === 'all' ? 'all' : status.toUpperCase() as 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  );

  let settlements = response.data || [];

  // 키워드 필터링 (프론트엔드에서 처리)
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    settlements = settlements.filter(s =>
      s.projectTitle?.toLowerCase().includes(keyword) ||
      s.accountHolder?.toLowerCase().includes(keyword)
    );
  }

  // 페이지네이션 (프론트엔드에서 처리)
  const page = filters.page || 0;
  const size = filters.size || 10;
  const start = page * size;
  const paginatedSettlements = settlements.slice(start, start + size);

  return {
    content: paginatedSettlements,
    totalPages: Math.ceil(settlements.length / size),
    currentPage: page,
  };
};

/**
 * 정산 완료 처리
 */
export const completeSettlement = async (settlementId: number): Promise<{ data: SettlementResponse }> => {
  return apiClient.post<{ data: SettlementResponse }>(`/settlement-requests/${settlementId}/complete`, {});
};

/**
 * 시스템 메트릭 조회
 */
export const getSystemMetrics = async (): Promise<{ data: import('../types/admin').SystemMetrics }> => {
  return apiClient.get<{ data: import('../types/admin').SystemMetrics }>('/admin/metrics/system');
};

// ==================== 차트 통계 타입 ====================
export interface DonationTrend {
  label: string;
  amount: number;
  count: number;
}

export interface UserTrend {
  label: string;
  individual: number;
  organization: number;
  total: number;
}

export interface ProjectStats {
  ongoing: number;      // 진행 중
  settlement: number;   // 결산 중
  closed: number;       // 종료
  rejected: number;     // 반려
  total: number;        // 전체
}

export interface ProjectTrend {
  label: string;
  newProjects: number;
  completedProjects: number;
}

export interface DonationTrendResponse {
  period: string;
  data: DonationTrend[];
  totalAmount: number;
  totalCount: number;
}

export interface UserTrendResponse {
  period: string;
  data: UserTrend[];
  totalIndividual: number;
  totalOrganization: number;
}

export interface ProjectStatsResponse {
  stats: ProjectStats;
  trend: ProjectTrend[];
  period: string;
}

// ==================== 차트 API 함수 ====================

/**
 * 기부 추이 차트 데이터 조회
 */
export const getDonationTrend = async (period: 'weekly' | 'monthly' = 'weekly'): Promise<{ data: DonationTrendResponse }> => {
  return apiClient.get<{ data: DonationTrendResponse }>(`/admin/charts/donation-trend?period=${period}`);
};

/**
 * 사용자 가입 추이 차트 데이터 조회
 */
export const getUserTrend = async (period: 'weekly' | 'monthly' = 'weekly'): Promise<{ data: UserTrendResponse }> => {
  return apiClient.get<{ data: UserTrendResponse }>(`/admin/charts/user-trend?period=${period}`);
};

/**
 * 프로젝트 통계 및 추이 차트 데이터 조회
 */
export const getProjectStats = async (period: 'weekly' | 'monthly' = 'weekly'): Promise<{ data: ProjectStatsResponse }> => {
  return apiClient.get<{ data: ProjectStatsResponse }>(`/admin/charts/project-stats?period=${period}`);
};
