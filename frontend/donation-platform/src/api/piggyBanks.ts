import { apiClient } from '../lib/apiClient';

// ==================== 응답 타입 ====================
export interface PiggyBankResponse {
  piggyBankId: number;
  projectId: number;
  projectTitle: string;
  totalAmount: number;
  withdrawnAmount: number;
  balance: number;
  status: 'ACTIVE' | 'LOCKED' | 'CLOSED';
  createdAt: string;
  lastUpdated: string;
  // 추가 정보
  targetAmount?: number;
  achievementRate?: number;
  donorCount?: number;
  recentDonations?: number;
}

export interface TransactionResponse {
  id: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  donor?: string;
  message?: string;
  note?: string;
  timestamp: string;
  receiptNumber?: string;
  settlementId?: string;
}

export interface TransactionFilters {
  type?: 'all' | 'deposit' | 'withdrawal';
  date?: 'all' | 'today' | 'week' | 'month';
  page?: number;
  size?: number;
}

// ==================== API 함수 ====================

/**
 * 나의 저금통 목록
 */
export const getMyPiggyBanks = async (): Promise<PiggyBankResponse[]> => {
  return apiClient.get<PiggyBankResponse[]>('/piggy-banks');
};

/**
 * 저금통 상세 조회
 */
export const getPiggyBank = async (id: number): Promise<PiggyBankResponse> => {
  return apiClient.get<PiggyBankResponse>(`/piggy-banks/${id}`);
};

/**
 * 저금통 거래 내역
 */
export const getPiggyBankTransactions = async (
  id: number,
  filters: TransactionFilters = {}
): Promise<{ content: TransactionResponse[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/piggy-banks/${id}/transactions?${params.toString()}`);
};
