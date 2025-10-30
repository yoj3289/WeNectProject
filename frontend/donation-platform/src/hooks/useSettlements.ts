import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as settlementsApi from '../api/settlements';

/**
 * 나의 정산 내역
 */
export function useMySettlements(filters: settlementsApi.SettlementFilters = {}) {
  return useQuery({
    queryKey: ['my-settlements', filters],
    queryFn: () => settlementsApi.getMySettlements(filters),
  });
}

/**
 * 정산 상세 조회
 */
export function useSettlement(id: number) {
  return useQuery({
    queryKey: ['settlement', id],
    queryFn: () => settlementsApi.getSettlement(id),
    enabled: !!id,
  });
}

/**
 * 정산 이력 조회
 */
export function useSettlementHistory() {
  return useQuery({
    queryKey: ['settlement-history'],
    queryFn: settlementsApi.getSettlementHistory,
  });
}

/**
 * 정산 요청
 */
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settlementsApi.createSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlement-history'] });
      queryClient.invalidateQueries({ queryKey: ['my-piggy-banks'] });
    },
  });
}

/**
 * 정산 서류 업로드
 */
export function useUploadSettlementDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ settlementId, file }: { settlementId: number; file: File }) =>
      settlementsApi.uploadSettlementDocument(settlementId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlement', variables.settlementId] });
    },
  });
}
