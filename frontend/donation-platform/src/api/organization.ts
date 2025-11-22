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
  status?: string;
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
 * 기관 프로젝트 목록 조회
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
