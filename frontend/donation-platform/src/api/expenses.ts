import { apiClient } from '../lib/apiClient';
import type { Expense, SettlementSummary } from '../types';

// ==================== 요청 타입 ====================
export interface CreateExpenseRequest {
  projectId: number;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  receiptUrl: string;
  receiptThumbnailUrl?: string;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {}

// ==================== API 함수 ====================

/**
 * 프로젝트별 지출 내역 조회
 */
export async function getExpensesByProject(projectId: number): Promise<Expense[]> {
  return apiClient.get<Expense[]>(`/api/expenses/project/${projectId}`);
}

/**
 * 프로젝트별 + 상태별 지출 내역 조회
 */
export async function getExpensesByProjectAndStatus(
  projectId: number,
  status: string
): Promise<Expense[]> {
  return apiClient.get<Expense[]>(`/api/expenses/project/${projectId}/status/${status}`);
}

/**
 * 지출 내역 상세 조회
 */
export async function getExpense(expenseId: number): Promise<Expense> {
  return apiClient.get<Expense>(`/api/expenses/${expenseId}`);
}

/**
 * 지출 내역 등록
 */
export async function createExpense(request: CreateExpenseRequest): Promise<Expense> {
  return apiClient.post<Expense>('/api/expenses', request);
}

/**
 * 지출 내역 수정
 */
export async function updateExpense(
  expenseId: number,
  request: UpdateExpenseRequest
): Promise<Expense> {
  return apiClient.put<Expense>(`/api/expenses/${expenseId}`, request);
}

/**
 * 지출 내역 삭제
 */
export async function deleteExpense(expenseId: number): Promise<void> {
  await apiClient.delete(`/api/expenses/${expenseId}`);
}

/**
 * 지출 승인 (관리자)
 */
export async function approveExpense(expenseId: number): Promise<Expense> {
  return apiClient.post<Expense>(`/api/expenses/${expenseId}/approve`);
}

/**
 * 지출 반려 (관리자)
 */
export async function rejectExpense(expenseId: number, reason: string): Promise<Expense> {
  return apiClient.post<Expense>(`/api/expenses/${expenseId}/reject`, null, {
    params: { reason },
  });
}

/**
 * 프로젝트 결산 요약 조회
 */
export async function getSettlementSummary(projectId: number): Promise<SettlementSummary> {
  return apiClient.get<SettlementSummary>(`/api/settlements/project/${projectId}`);
}
