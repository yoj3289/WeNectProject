import { apiClient } from '../lib/apiClient';

// ==================== 요청 타입 ====================
export interface WithdrawalRequest {
  amount: number;
  category: string;
  description: string;
  expenseDate: string; // YYYY-MM-DD
}

// ==================== 응답 타입 ====================
export interface PiggyBankResponse {
  piggyId: number;
  projectId: number;
  projectTitle?: string;
  totalAmount: number;
  withdrawnAmount: number;
  balance: number;
  status: 'ACTIVE' | 'WITHDRAWN' | 'LOCKED';
  lastUpdated: string;
  createdAt: string;
}

export interface CategoryStat {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseResponse {
  expenseId: number;
  projectId: number;
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  receiptUrl: string;
  receiptThumbnailUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PiggyBankDetailResponse {
  piggyId: number;
  projectId: number;
  projectTitle: string;
  totalAmount: number;
  withdrawnAmount: number;
  balance: number;
  status: string;
  lastUpdated: string;
  createdAt: string;
  withdrawalHistory: ExpenseResponse[];
  categoryStats: CategoryStat[];
}

// ==================== API 함수 ====================

/**
 * 프로젝트 ID로 저금통 조회
 */
export const getPiggyBankByProject = async (projectId: number): Promise<PiggyBankResponse> => {
  const response = await apiClient.get<{ success: boolean; data: PiggyBankResponse }>(
    `/piggy-banks/project/${projectId}`
  );
  return response.data;
};

/**
 * 저금통 상세 정보 조회 (지출 내역 포함)
 */
export const getPiggyBankDetail = async (piggyId: number): Promise<PiggyBankDetailResponse> => {
  const response = await apiClient.get<{ success: boolean; data: PiggyBankDetailResponse }>(
    `/piggy-banks/${piggyId}/detail`
  );
  return response.data;
};

/**
 * 저금통 인출 (기관 사용자)
 */
export const withdrawFromPiggyBank = async (
  piggyId: number,
  data: WithdrawalRequest,
  receiptFile: File
): Promise<PiggyBankResponse> => {
  const formData = new FormData();

  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('data', jsonBlob);
  formData.append('receiptFile', receiptFile);

  const response = await apiClient.post<{ success: boolean; data: PiggyBankResponse }>(
    `/piggy-banks/${piggyId}/withdraw`,
    formData
  );
  return response.data;
};

/**
 * 기관의 모든 저금통 조회
 */
export const getPiggyBanksByOrganization = async (
  projectIds: number[]
): Promise<PiggyBankResponse[]> => {
  const response = await apiClient.post<{ success: boolean; data: PiggyBankResponse[] }>(
    '/piggy-banks/organization',
    projectIds
  );
  return response.data;
};

/**
 * 전체 저금통 잔액 합계 (기관 대시보드용)
 */
export const getTotalBalance = async (projectIds: number[]): Promise<number> => {
  const response = await apiClient.post<{ success: boolean; data: number }>(
    '/piggy-banks/total-balance',
    projectIds
  );
  return response.data;
};
