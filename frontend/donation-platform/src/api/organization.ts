import { apiClient } from '../lib/apiClient';
import type { Project } from '../types';

/**
 * 페이지네이션 응답 타입
 */
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 기관 목록 응답 타입
 */
export interface OrganizationListResponse {
  id: number;
  orgName: string;
  representative: string;
  description: string;
  logoUrl: string;
  totalProjects: number;
  activeProjects: number;
  settlementProjects: number;
  createdAt: string;
}

/**
 * 기관 목록 필터 옵션
 */
export interface OrganizationFilters {
  search?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

/**
 * 기관 통계 응답 타입
 */
export interface OrganizationStats {
  totalProjects: number;
  activeProjects: number;
  settlementProjects: number;
  closedProjects: number;
  totalFunding: number;
  activeFunding: number;
  totalWalletBalance: number;
}

/**
 * 프로젝트 필터 옵션
 */
export interface OrganizationProjectFilters {
  status?: 'active' | 'settlement';  // active: 진행중, settlement: 결산/종료
  category?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

/**
 * 기관 통계 조회
 * GET /api/organization/stats
 */
export const getOrganizationStats = async (): Promise<OrganizationStats> => {
  const response = await apiClient.get<{ success: boolean; data: OrganizationStats; message: string }>(
    '/organization/stats'
  );
  return response.data;
};

/**
 * 기관 목록 조회 (공개 API)
 * GET /api/organization/list
 */
export const getOrganizations = async (
  filters: OrganizationFilters = {}
): Promise<PageResponse<OrganizationListResponse>> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get<PageResponse<OrganizationListResponse>>(`/organization/list?${params.toString()}`);
};

/**
 * 특정 기관의 프로젝트 목록 조회 (공개 API)
 * GET /api/projects/by-organization/{orgId}
 */
export const getOrganizationProjectsById = async (
  orgId: number,
  filters: OrganizationProjectFilters = {}
): Promise<PageResponse<Project>> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get<PageResponse<Project>>(`/projects/by-organization/${orgId}?${params.toString()}`);
};

/**
 * 기관 프로젝트 목록 조회 (기관 회원 전용)
 * GET /api/organization/projects
 */
export const getOrganizationProjects = async (
  filters: OrganizationProjectFilters = {}
): Promise<PageResponse<Project>> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get<PageResponse<Project>>(`/organization/projects?${params.toString()}`);
};
