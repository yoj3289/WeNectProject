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
  userType?: 'all' | 'individual' | 'organization' | 'admin';
  status?: 'all' | 'active' | 'inactive' | 'suspended';
  keyword?: string;
  page?: number;
  size?: number;
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
  stats: {
    todayDonation: number;
    donationChange: number;
    newUsers: number;
    userChange: number;
    pendingApprovals: number;
    pendingSettlements: number;
  };
  recentProjects: Array<{
    id: number;
    title: string;
    org: string;
    amount: number;
    status: string;
    date: string;
    category: string;
  }>;
  weeklyDonations: number[];
  categoryDistribution: Array<{
    name: string;
    percent: number;
    color: string;
  }>;
}

export interface AdminUserResponse {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  registeredDate: string;
  lastLogin: string;
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
export const getAdminDashboard = async (): Promise<AdminDashboardResponse> => {
  return apiClient.get<AdminDashboardResponse>('/admin/dashboard');
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
): Promise<{ content: AdminUserResponse[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/admin/users?${params.toString()}`);
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
 * 관리자 - 정산 요청 목록
 */
export const getAdminSettlements = async (
  filters: AdminSettlementFilters = {}
): Promise<{ content: any[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/admin/settlements?${params.toString()}`);
};

/**
 * 정산 승인
 */
export const approveSettlement = async (data: ApproveSettlementRequest): Promise<void> => {
  return apiClient.put<void>(`/admin/settlements/${data.settlementId}/approve`, data);
};

/**
 * 정산 반려
 */
export const rejectSettlement = async (data: RejectSettlementRequest): Promise<void> => {
  return apiClient.put<void>(`/admin/settlements/${data.settlementId}/reject`, data);
};

/**
 * 정산 완료 (송금 완료)
 */
export const completeSettlement = async (settlementId: number): Promise<void> => {
  return apiClient.put<void>(`/admin/settlements/${settlementId}/complete`);
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
export const getCategoryDistribution = async (): Promise<
  Array<{ name: string; percent: number; color: string }>
> => {
  return apiClient.get('/admin/metrics/category-distribution');
};
