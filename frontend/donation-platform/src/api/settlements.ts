import { apiClient } from '../lib/apiClient';

// ==================== 요청 타입 ====================
export interface CreateSettlementRequest {
  piggyBankId: number;
  requestAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface SettlementFilters {
  status?: 'all' | 'pending' | 'approved' | 'completed' | 'rejected';
  keyword?: string;
  page?: number;
  size?: number;
}

// ==================== 응답 타입 ====================
export interface SettlementResponse {
  settlementId: number;
  piggyBankId: number;
  projectTitle: string;
  requestAmount: number;
  fee: number;
  transferAmount: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  documents?: Array<{
    documentId: number;
    fileName: string;
    fileUrl: string;
  }>;
}

export interface SettlementHistoryResponse {
  id: number;
  piggyBankId: number;
  projectTitle: string;
  requestDate: string;
  requestAmount: number;
  status: 'completed' | 'pending' | 'rejected';
  approvedDate?: string;
  completedDate?: string;
  transferredAmount?: number;
  fee?: number;
  feeRate: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  documents: string[];
  rejectionReason?: string;
}

// ==================== API 함수 ====================

/**
 * 정산 요청
 */
export const createSettlement = async (
  data: CreateSettlementRequest
): Promise<SettlementResponse> => {
  return apiClient.post<SettlementResponse>('/settlements', data);
};

/**
 * 나의 정산 내역
 */
export const getMySettlements = async (
  filters: SettlementFilters = {}
): Promise<{ content: SettlementResponse[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/settlements?${params.toString()}`);
};

/**
 * 정산 상세 조회
 */
export const getSettlement = async (id: number): Promise<SettlementResponse> => {
  return apiClient.get<SettlementResponse>(`/settlements/${id}`);
};

/**
 * 정산 서류 업로드
 */
export const uploadSettlementDocument = async (
  settlementId: number,
  file: File
): Promise<{ documentId: number; fileUrl: string }> => {
  return apiClient.uploadFile(
    `/settlements/${settlementId}/documents`,
    file
  );
};

/**
 * 정산 이력 조회 (기관용)
 */
export const getSettlementHistory = async (): Promise<SettlementHistoryResponse[]> => {
  return apiClient.get<SettlementHistoryResponse[]>('/settlements/history');
};
