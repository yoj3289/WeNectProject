import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';

/**
 * 프로젝트 목록 조회
 */
export function useProjects(filters: projectsApi.ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectsApi.getProjects(filters),
    // 30초마다 백그라운드에서 자동 갱신
    refetchInterval: 30000,
  });
}

/**
 * 인기 프로젝트 조회 (홈페이지용)
 */
export function usePopularProjects(limit: number = 4) {
  return useQuery({
    queryKey: ['popular-projects', limit],
    queryFn: () => projectsApi.getPopularProjects(limit),
    // 5분간 캐시 유지
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 프로젝트 상세 조회
 */
export function useProject(id: number) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id),
    enabled: !!id, // id가 있을 때만 실행
  });
}

/**
 * 프로젝트 상세 조회 (alias)
 */
export function useProjectDetail(id: number) {
  return useProject(id);
}

/**
 * 프로젝트 기부자 목록
 */
export function useProjectDonors(projectId: number, showAnonymous: boolean = true) {
  return useQuery({
    queryKey: ['project-donors', projectId, showAnonymous],
    queryFn: () => projectsApi.getProjectDonors(projectId, showAnonymous),
    enabled: !!projectId,
  });
}

/**
 * 프로젝트 응원 메시지
 */
export function useProjectMessages(projectId: number) {
  return useQuery({
    queryKey: ['project-messages', projectId],
    queryFn: () => projectsApi.getProjectMessages(projectId),
    enabled: !!projectId,
  });
}

/**
 * 카테고리 목록 조회
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: projectsApi.getCategories,
    // 카테고리는 거의 변하지 않으므로 1시간 캐시
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * 프로젝트 등록
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      // 프로젝트 목록 쿼리 무효화 (재조회)
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * 프로젝트 수정
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: projectsApi.UpdateProjectRequest }) =>
      projectsApi.updateProject(id, data),
    onSuccess: (_, variables) => {
      // 해당 프로젝트 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * 프로젝트 삭제
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * 프로젝트 이미지 업로드
 */
export function useUploadProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, file }: { projectId: number; file: File }) =>
      projectsApi.uploadProjectImage(projectId, file),
    onSuccess: (_, variables) => {
      // 프로젝트 상세 쿼리 무효화 (이미지 목록 갱신)
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
}

/**
 * 프로젝트 이미지 삭제
 */
export function useDeleteProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, imageId }: { projectId: number; imageId: number }) =>
      projectsApi.deleteProjectImage(projectId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
}

/**
 * 관심 프로젝트 토글
 */
export function useToggleFavoriteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => projectsApi.toggleFavoriteProject(projectId),
    onSuccess: () => {
      // 관심 프로젝트 목록 무효화
      queryClient.invalidateQueries({ queryKey: ['favorite-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['popular-projects'] });
    },
  });
}

/**
 * 사용자의 관심 프로젝트 목록 조회
 */
export function useUserFavoriteProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ['favorite-projects'],
    queryFn: () => projectsApi.getUserFavoriteProjects(),
    enabled, // 로그인 상태에서만 실행
    retry: false, // 인증 실패 시 재시도 안함
  });
}
