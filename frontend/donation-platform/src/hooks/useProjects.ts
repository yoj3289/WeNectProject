import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';

/**
 * 프로젝트 목록 조회
 */
export function useProjects(filters: projectsApi.ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectsApi.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true, // 포커스 시 재조회
    refetchOnReconnect: true, // 재연결 시 재조회
  });
}

/**
 * 인기 프로젝트 조회 (홈페이지용 - 관심 등록 수 기준)
 */
export function usePopularProjects(limit: number = 4) {
  return useQuery({
    queryKey: ['popular-projects', limit],
    queryFn: () => projectsApi.getPopularProjects(limit),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 최신 데이터 가져오기
  });
}

/**
 * 모금액 순 프로젝트 조회 (홈페이지용)
 */
export function useTopFundedProjects(limit: number = 8) {
  return useQuery({
    queryKey: ['top-funded-projects', limit],
    queryFn: () => projectsApi.getTopFundedProjects(limit),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 최신 데이터 가져오기
  });
}

/**
 * 결산 중/종료된 프로젝트 목록 조회
 * COMPLETED, SETTLEMENT, CLOSED 상태의 프로젝트
 */
export function useSettlementProjects(filters: projectsApi.ProjectFilters = {}) {
  return useQuery({
    queryKey: ['settlement-projects', filters],
    queryFn: () => projectsApi.getSettlementProjects(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * 종료된 프로젝트 목록 조회
 * CLOSED 상태의 프로젝트만
 */
export function useClosedProjects(filters: projectsApi.ProjectFilters = {}) {
  return useQuery({
    queryKey: ['closed-projects', filters],
    queryFn: () => projectsApi.getClosedProjects(filters),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
 * - 제목/소개: ACTIVE, COMPLETED 상태에서 수정 가능
 * - 사용계획: COMPLETED 상태에서만 수정 가능 (변경 사유 필수)
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      title,
      description,
      budgetPlan,
      budgetPlanChangeReason,
    }: {
      projectId: number;
      title: string;
      description: string;
      budgetPlan?: string;
      budgetPlanChangeReason?: string;
    }) => projectsApi.updateProject(projectId, { title, description, budgetPlan, budgetPlanChangeReason }),
    onSuccess: (_, variables) => {
      // 프로젝트 목록 및 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-projects'] });
      queryClient.invalidateQueries({ queryKey: ['closed-projects'] });
      queryClient.invalidateQueries({ queryKey: ['budget-plan-history', variables.projectId] });
    },
  });
}

/**
 * 프로젝트 사용계획 변경 이력 조회
 */
export function useBudgetPlanHistory(projectId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['budget-plan-history', projectId],
    queryFn: () => projectsApi.getBudgetPlanHistory(projectId),
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000,
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

/**
 * 프로젝트 결산 완료 (프로젝트 종료)
 * 저금통 잔액이 0원일 때만 가능
 */
export function useCloseProjectSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => projectsApi.closeProjectSettlement(projectId),
    onSuccess: (_, projectId) => {
      // 프로젝트 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['settlement-projects'] });
      // 저금통 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['piggyBank'] });
      queryClient.invalidateQueries({ queryKey: ['piggyBanks'] });
    },
  });
}
