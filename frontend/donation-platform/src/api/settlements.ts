import { apiClient } from '../lib/apiClient';

// ==================== 요청 타입 ====================
export interface CreateSettlementRequest {
  projectId: number;
  settlementAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface SettlementApproveRequest {
  adminMemo?: string;
}

export interface SettlementRejectRequest {
  rejectionReason: string;
}

// ==================== 응답 타입 ====================
export interface SettlementDocument {
  documentId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  documentType: string;
  uploadedAt: string;
}

export interface SettlementResponse {
  settlementId: number;
  projectId: number;
  projectTitle?: string;
  piggyId?: number;
  settlementAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  adminMemo?: string;
  documents: SettlementDocument[];
}

// ==================== API 함수 ====================

/**
 * 정산 요청 생성 (기관 사용자)
 */
export const createSettlementRequest = async (
  data: CreateSettlementRequest,
  documents?: File[]
): Promise<SettlementResponse> => {
  const formData = new FormData();

  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  if (documents && documents.length > 0) {
    documents.forEach((file) => {
      formData.append('documents', file);
    });
  }

  const response = await apiClient.post<{ success: boolean; data: SettlementResponse }>(
    '/settlement-requests/request',
    formData
  );
  return response.data;
};

/**
 * 정산 승인 (관리자)
 */
export const approveSettlement = async (
  settlementId: number,
  data: SettlementApproveRequest
): Promise<SettlementResponse> => {
  const response = await apiClient.post<{ success: boolean; data: SettlementResponse }>(
    `/settlement-requests/${settlementId}/approve`,
    data
  );
  return response.data;
};

/**
 * 정산 반려 (관리자)
 */
export const rejectSettlement = async (
  settlementId: number,
  data: SettlementRejectRequest
): Promise<SettlementResponse> => {
  const response = await apiClient.post<{ success: boolean; data: SettlementResponse }>(
    `/settlement-requests/${settlementId}/reject`,
    data
  );
  return response.data;
};

/**
 * 정산 상세 조회
 */
export const getSettlement = async (settlementId: number): Promise<SettlementResponse> => {
  const response = await apiClient.get<{ success: boolean; data: SettlementResponse }>(
    `/settlement-requests/${settlementId}`
  );
  return response.data;
};

/**
 * 프로젝트별 정산 목록 조회
 */
export const getSettlementsByProject = async (projectId: number): Promise<SettlementResponse[]> => {
  const response = await apiClient.get<{ success: boolean; data: SettlementResponse[] }>(
    `/settlement-requests/project/${projectId}`
  );
  return response.data;
};

/**
 * 상태별 정산 목록 조회 (관리자)
 */
export const getSettlementsByStatus = async (status: string): Promise<SettlementResponse[]> => {
  const response = await apiClient.get<{ success: boolean; data: SettlementResponse[] }>(
    `/settlement-requests/status/${status}`
  );
  return response.data;
};

/**
 * 대기 중인 정산 개수 조회 (관리자 대시보드용)
 */
export const getPendingSettlementCount = async (): Promise<number> => {
  const response = await apiClient.get<{ success: boolean; data: number }>(
    '/settlement-requests/pending/count'
  );
  return response.data;
};
