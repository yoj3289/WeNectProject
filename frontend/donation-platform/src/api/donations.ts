import { apiClient } from '../lib/apiClient';

// ==================== 요청 타입 ====================
export interface CreateDonationRequest {
  projectId: number;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'KAKAO_PAY' | 'TOSS_PAY';
}

export interface DonationFilters {
  year?: string;
  status?: 'completed' | 'pending';
  keyword?: string;
  page?: number;
  size?: number;
}

// ==================== 응답 타입 ====================
export interface DonationResponse {
  donationId: number;
  projectId: number;
  projectTitle: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  donatedAt: string;
  receiptNumber?: string;
}

export interface DonationHistoryResponse {
  id: number;
  projectTitle: string;
  organization: string;
  amount: number;
  date: string;
  receiptNumber: string;
  status: 'completed' | 'pending';
  donorName: string;
}

export interface RecentDonationResponse {
  donorName: string; // 익명 처리된 이름 (김**, 익명)
  amount: number;
  projectTitle: string;
  timestamp: string;
}

export interface PaymentResponse {
  paymentId: number;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod: string;
  createdAt: string;
}

export interface ReceiptResponse {
  receiptId: number;
  receiptNumber: string;
  pdfUrl: string;
  issuedAt: string;
  donation: {
    donationId: number;
    projectTitle: string;
    amount: number;
    donatedAt: string;
  };
}

// ==================== API 함수 ====================

/**
 * 기부하기
 */
export const createDonation = async (data: CreateDonationRequest): Promise<DonationResponse> => {
  return apiClient.post<DonationResponse>('/donations', data);
};

/**
 * 나의 기부 내역 조회
 */
export const getMyDonations = async (
  filters: DonationFilters = {}
): Promise<{ content: DonationHistoryResponse[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/donations/my?${params.toString()}`);
};

/**
 * 최근 기부 내역 조회 (공개, 홈페이지용)
 */
export const getRecentDonations = async (limit: number = 4): Promise<RecentDonationResponse[]> => {
  return apiClient.get<RecentDonationResponse[]>(`/donations/recent?limit=${limit}`);
};

/**
 * 프로젝트별 기부 내역
 */
export const getProjectDonations = async (projectId: number): Promise<DonationResponse[]> => {
  return apiClient.get<DonationResponse[]>(`/projects/${projectId}/donations`);
};

/**
 * 영수증 조회
 */
export const getReceipt = async (receiptNumber: string): Promise<ReceiptResponse> => {
  return apiClient.get<ReceiptResponse>(`/receipts/${receiptNumber}`);
};

/**
 * 영수증 PDF 다운로드
 */
export const downloadReceiptPdf = async (receiptNumber: string): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/receipts/${receiptNumber}/pdf`, {
    responseType: 'blob',
  });
  return response;
};

/**
 * 결제 요청
 */
export const createPayment = async (data: {
  amount: number;
  paymentMethod: string;
}): Promise<PaymentResponse> => {
  return apiClient.post<PaymentResponse>('/payments', data);
};

/**
 * 결제 확인
 */
export const confirmPayment = async (paymentId: number): Promise<PaymentResponse> => {
  return apiClient.post<PaymentResponse>(`/payments/${paymentId}/confirm`);
};

/**
 * 결제 내역 조회
 */
export const getPayment = async (paymentId: number): Promise<PaymentResponse> => {
  return apiClient.get<PaymentResponse>(`/payments/${paymentId}`);
};
