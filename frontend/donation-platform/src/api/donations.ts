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
  organizationName?: string; // 백엔드에서 반환하는 기관명
  amount: number;
  date: string;
  receiptNumber: string;
  status: 'completed' | 'pending';
  donorName: string;
}

export interface DonationStatsResponse {
  totalAmount: number;
  totalCount: number;
  completedCount: number;
}

export interface RecentDonationResponse {
  donationId: number;
  donorName: string; // 익명 처리된 이름 (김**, 익명)
  amount: number;
  projectTitle: string;
  message?: string;
  isFeatured: boolean;
  timestamp: string;
}

export interface FeaturedMessageResponse {
  donationId: number;
  message: string;
  donorName: string;
  projectTitle: string;
  donatedAt: string;
  isFeatured: boolean;
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
 * 나의 기부 내역 조회 (페이지네이션 지원)
 */
export const getMyDonations = async (
  filters: DonationFilters = {}
): Promise<{ content: DonationHistoryResponse[]; totalPages: number; currentPage: number; totalElements: number; size: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/donations/my?${params.toString()}`);
};

/**
 * 나의 기부 통계 조회
 */
export const getMyDonationStats = async (): Promise<DonationStatsResponse> => {
  return apiClient.get<DonationStatsResponse>('/donations/my/stats');
};

/**
 * 최근 기부 내역 조회 (공개, 홈페이지용)
 */
export const getRecentDonations = async (limit: number = 4): Promise<RecentDonationResponse[]> => {
  return apiClient.get<RecentDonationResponse[]>(`/donations/recent?limit=${limit}`);
};

/**
 * 홈페이지 후기 섹션용 Featured 응원 메시지 조회 (공개)
 */
export const getFeaturedMessages = async (limit: number = 3): Promise<FeaturedMessageResponse[]> => {
  return apiClient.get<FeaturedMessageResponse[]>(`/donations/featured?limit=${limit}`);
};

/**
 * 기부 메시지의 Featured 상태 토글 (관리자용)
 */
export const toggleFeatured = async (donationId: number, isFeatured: boolean): Promise<string> => {
  return apiClient.patch<string>(`/donations/${donationId}/featured?isFeatured=${isFeatured}`);
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

// ==================== 관리자용 API ====================

export interface AdminDonationFilters {
  status?: string;      // all, completed, pending, cancelled, failed
  hasMessage?: boolean;
  isFeatured?: boolean;
  period?: string;      // week, month, 3months, all
  page?: number;
  size?: number;
}

export interface AdminDonationResponse {
  donationId: number;
  projectId: number;
  projectTitle: string;
  userId: number;
  donorName: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  isFeatured: boolean;
  status: string;
  donatedAt: string;
  createdAt: string;
}

export interface AdminDonationPageResponse {
  content: AdminDonationResponse[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
  size: number;
}

/**
 * 관리자용 전체 기부 내역 조회 (필터 지원)
 */
export const getAdminDonations = async (
  filters: AdminDonationFilters = {}
): Promise<AdminDonationPageResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return apiClient.get(`/donations/admin/all?${params.toString()}`);
};
