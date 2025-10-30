import { apiClient } from '../lib/apiClient';
import type { Project } from '../types';

// ==================== 요청 타입 ====================
export interface ProjectFilters {
  category?: string;
  status?: string;
  sort?: string;
  sortBy?: string;
  keyword?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  categoryId: number;
  thumbnailUrl?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

// ==================== 응답 타입 ====================
export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export interface ProjectDetailResponse {
  id: number;
  title: string;
  category: string;
  currentAmount: number;
  targetAmount: number;
  dday: number;
  donors: number;
  image: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  startDate: string;
  endDate: string;
  organization: {
    organizationId: number;
    name: string;
    introduction: string;
    websiteUrl?: string;
  };
  images: Array<{
    imageId: number;
    imageUrl: string;
    caption?: string;
  }>;
  documents: Array<{
    documentId: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
}

export interface DonorResponse {
  id: number;
  name: string;
  amount: number;
  date: string;
  isAnonymous: boolean;
  message?: string;
}

export interface CategoryResponse {
  categoryId: number;
  name: string;
  description: string;
  iconName: string;
  colorClass: string;
}

// ==================== API 함수 ====================

/**
 * 프로젝트 목록 조회 (페이징, 필터링, 정렬)
 */
export const getProjects = async (
  filters: ProjectFilters = {}
): Promise<PageResponse<Project>> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get<PageResponse<Project>>(`/projects?${params.toString()}`);
};

/**
 * 인기 프로젝트 조회 (홈페이지용)
 */
export const getPopularProjects = async (limit: number = 4): Promise<Project[]> => {
  return apiClient.get<Project[]>(`/projects/popular?limit=${limit}`);
};

/**
 * 프로젝트 상세 조회
 */
export const getProject = async (id: number): Promise<ProjectDetailResponse> => {
  return apiClient.get<ProjectDetailResponse>(`/projects/${id}`);
};

/**
 * 프로젝트 등록 (기관 회원만)
 */
export const createProject = async (data: CreateProjectRequest | FormData): Promise<Project> => {
  return apiClient.post<Project>('/projects', data);
};

/**
 * 프로젝트 수정
 */
export const updateProject = async (
  id: number,
  data: UpdateProjectRequest
): Promise<Project> => {
  return apiClient.put<Project>(`/projects/${id}`, data);
};

/**
 * 프로젝트 삭제
 */
export const deleteProject = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`/projects/${id}`);
};

/**
 * 프로젝트 기부자 목록
 */
export const getProjectDonors = async (
  projectId: number,
  showAnonymous: boolean = true
): Promise<DonorResponse[]> => {
  return apiClient.get<DonorResponse[]>(
    `/projects/${projectId}/donors?showAnonymous=${showAnonymous}`
  );
};

/**
 * 프로젝트 응원 메시지 목록
 */
export const getProjectMessages = async (projectId: number): Promise<DonorResponse[]> => {
  return apiClient.get<DonorResponse[]>(`/projects/${projectId}/messages`);
};

/**
 * 프로젝트 이미지 업로드
 */
export const uploadProjectImage = async (
  projectId: number,
  file: File
): Promise<{ imageUrl: string }> => {
  return apiClient.uploadFile<{ imageUrl: string }>(
    `/projects/${projectId}/images`,
    file,
    'file'
  );
};

/**
 * 프로젝트 이미지 삭제
 */
export const deleteProjectImage = async (
  projectId: number,
  imageId: number
): Promise<void> => {
  return apiClient.delete<void>(`/projects/${projectId}/images/${imageId}`);
};

/**
 * 카테고리 목록 조회
 */
export const getCategories = async (): Promise<CategoryResponse[]> => {
  return apiClient.get<CategoryResponse[]>('/categories');
};

/**
 * 카테고리 상세 조회
 */
export const getCategory = async (id: number): Promise<CategoryResponse> => {
  return apiClient.get<CategoryResponse>(`/categories/${id}`);
};

/**
 * 관심 프로젝트 토글 (찜하기/찜해제)
 */
export const toggleFavoriteProject = async (projectId: number): Promise<void> => {
  return apiClient.post<void>(`/projects/${projectId}/favorite`);
};
