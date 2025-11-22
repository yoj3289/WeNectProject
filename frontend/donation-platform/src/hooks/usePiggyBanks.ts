import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as piggyBanksApi from '../api/piggyBanks';

/**
 * 저금통 관련 hooks
 */

// 프로젝트별 저금통 조회
export function usePiggyBankByProject(projectId: number | null) {
  return useQuery({
    queryKey: ['piggyBank', 'project', projectId],
    queryFn: () => piggyBanksApi.getPiggyBankByProject(projectId!),
    enabled: projectId !== null,
  });
}

// 저금통 상세 정보 조회
export function usePiggyBankDetail(piggyId: number | null) {
  return useQuery({
    queryKey: ['piggyBank', 'detail', piggyId],
    queryFn: () => piggyBanksApi.getPiggyBankDetail(piggyId!),
    enabled: piggyId !== null,
  });
}

// 기관의 모든 저금통 조회
export function usePiggyBanksByOrganization(projectIds: number[]) {
  return useQuery({
    queryKey: ['piggyBanks', 'organization', projectIds],
    queryFn: () => piggyBanksApi.getPiggyBanksByOrganization(projectIds),
    enabled: projectIds.length > 0,
  });
}

// 전체 저금통 잔액 합계
export function useTotalBalance(projectIds: number[]) {
  return useQuery({
    queryKey: ['piggyBanks', 'totalBalance', projectIds],
    queryFn: () => piggyBanksApi.getTotalBalance(projectIds),
    enabled: projectIds.length > 0,
  });
}

// 저금통 인출
export function useWithdrawFromPiggyBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      piggyId,
      data,
      receiptFile,
    }: {
      piggyId: number;
      data: piggyBanksApi.WithdrawalRequest;
      receiptFile: File;
    }) => piggyBanksApi.withdrawFromPiggyBank(piggyId, data, receiptFile),
    onSuccess: (data) => {
      // 저금통 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['piggyBank', 'project', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['piggyBank', 'detail', data.piggyId] });
      // 기관의 전체 저금통 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['piggyBanks', 'organization'] });
      queryClient.invalidateQueries({ queryKey: ['piggyBanks', 'totalBalance'] });
      // 지출 내역 갱신
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
