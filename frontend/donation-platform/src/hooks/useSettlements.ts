import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settlementsApi from '../api/settlements';

/**
 * 정산 관련 hooks
 */

// 정산 상세 조회
export function useSettlement(settlementId: number | null) {
  return useQuery({
    queryKey: ['settlement', settlementId],
    queryFn: () => settlementsApi.getSettlement(settlementId!),
    enabled: settlementId !== null,
  });
}

// 프로젝트별 정산 목록 조회
export function useSettlementsByProject(projectId: number | null) {
  return useQuery({
    queryKey: ['settlements', 'project', projectId],
    queryFn: () => settlementsApi.getSettlementsByProject(projectId!),
    enabled: projectId !== null,
  });
}

// 상태별 정산 목록 조회 (관리자)
export function useSettlementsByStatus(status: string) {
  return useQuery({
    queryKey: ['settlements', 'status', status],
    queryFn: () => settlementsApi.getSettlementsByStatus(status),
    enabled: !!status,
  });
}

// 대기 중인 정산 개수 조회
export function usePendingSettlementCount() {
  return useQuery({
    queryKey: ['settlements', 'pending', 'count'],
    queryFn: () => settlementsApi.getPendingSettlementCount(),
  });
}

// 정산 요청 생성
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      documents,
    }: {
      data: settlementsApi.CreateSettlementRequest;
      documents?: File[];
    }) => settlementsApi.createSettlementRequest(data, documents),
    onSuccess: (data) => {
      // 해당 프로젝트의 정산 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['settlements', 'project', data.projectId] });
      // 대기 중인 정산 개수 갱신
      queryClient.invalidateQueries({ queryKey: ['settlements', 'pending', 'count'] });
    },
  });
}

// 정산 승인 (관리자)
export function useApproveSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      settlementId,
      data,
    }: {
      settlementId: number;
      data: settlementsApi.SettlementApproveRequest;
    }) => settlementsApi.approveSettlement(settlementId, data),
    onSuccess: (data) => {
      // 정산 상세 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['settlement', data.settlementId] });
      // 상태별 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['settlements', 'status'] });
      // 대기 중인 정산 개수 갱신
      queryClient.invalidateQueries({ queryKey: ['settlements', 'pending', 'count'] });
      // 저금통 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['piggyBank', 'project', data.projectId] });
    },
  });
}

// 정산 반려 (관리자)
export function useRejectSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      settlementId,
      data,
    }: {
      settlementId: number;
      data: settlementsApi.SettlementRejectRequest;
    }) => settlementsApi.rejectSettlement(settlementId, data),
    onSuccess: (data) => {
      // 정산 상세 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['settlement', data.settlementId] });
      // 상태별 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['settlements', 'status'] });
      // 대기 중인 정산 개수 갱신
      queryClient.invalidateQueries({ queryKey: ['settlements', 'pending', 'count'] });
    },
  });
}
