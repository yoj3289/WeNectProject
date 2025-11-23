import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as expensesApi from '../api/expenses';

/**
 * 프로젝트별 지출 내역 조회
 */
export function useExpenses(projectId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: () => expensesApi.getExpensesByProject(projectId),
    enabled: !!projectId && enabled,
  });
}

/**
 * 프로젝트별 + 상태별 지출 내역 조회
 */
export function useExpensesByProjectAndStatus(projectId: number, status: string) {
  return useQuery({
    queryKey: ['expenses', projectId, status],
    queryFn: () => expensesApi.getExpensesByProjectAndStatus(projectId, status),
    enabled: !!projectId && !!status,
  });
}

/**
 * 전체 지출 내역 상태별 조회 (관리자)
 */
export function useExpensesByStatus(status: string) {
  return useQuery({
    queryKey: ['expenses', 'all', status],
    queryFn: () => expensesApi.getAllExpensesByStatus(status),
    enabled: !!status,
  });
}

/**
 * 지출 내역 상세 조회
 */
export function useExpense(expenseId: number) {
  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => expensesApi.getExpense(expenseId),
    enabled: !!expenseId,
  });
}

/**
 * 지출 내역 등록
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-summary', data.projectId] });
    },
  });
}

/**
 * 지출 내역 수정
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, request }: { expenseId: number; request: expensesApi.UpdateExpenseRequest }) =>
      expensesApi.updateExpense(expenseId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.expenseId] });
    },
  });
}

/**
 * 지출 내역 삭제
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

/**
 * 지출 승인 (관리자)
 */
export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.approveExpense,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['settlement-summary', data.projectId] });
    },
  });
}

/**
 * 지출 반려 (관리자)
 */
export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, reason }: { expenseId: number; reason: string }) =>
      expensesApi.rejectExpense(expenseId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.expenseId] });
    },
  });
}

/**
 * 프로젝트 결산 요약 조회
 */
export function useSettlementSummary(projectId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['settlement-summary', projectId],
    queryFn: () => expensesApi.getSettlementSummary(projectId),
    enabled: !!projectId && enabled,
  });
}
