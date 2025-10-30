import { useQuery } from '@tanstack/react-query';
import * as piggyBanksApi from '../api/piggyBanks';

/**
 * 나의 저금통 목록
 */
export function useMyPiggyBanks() {
  return useQuery({
    queryKey: ['my-piggy-banks'],
    queryFn: piggyBanksApi.getMyPiggyBanks,
  });
}

/**
 * 저금통 상세 조회
 */
export function usePiggyBank(id: number) {
  return useQuery({
    queryKey: ['piggy-bank', id],
    queryFn: () => piggyBanksApi.getPiggyBank(id),
    enabled: !!id,
  });
}

/**
 * 저금통 거래 내역
 */
export function usePiggyBankTransactions(
  id: number,
  filters: piggyBanksApi.TransactionFilters = {}
) {
  return useQuery({
    queryKey: ['piggy-bank-transactions', id, filters],
    queryFn: () => piggyBanksApi.getPiggyBankTransactions(id, filters),
    enabled: !!id,
  });
}
