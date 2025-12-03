import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as donationsApi from '../api/donations';
import { getProjectDonors } from '../api/projects';

/**
 * 나의 기부 내역 조회
 */
export function useMyDonations(filters: donationsApi.DonationFilters = {}) {
  return useQuery({
    queryKey: ['my-donations', filters],
    queryFn: () => donationsApi.getMyDonations(filters),
  });
}

/**
 * 최근 기부 내역 조회 (공개, 홈페이지용)
 */
export function useRecentDonations(limit: number = 4) {
  return useQuery({
    queryKey: ['recent-donations', limit],
    queryFn: () => donationsApi.getRecentDonations(limit),
    staleTime: 2 * 60 * 1000, // 2분간 캐시
    refetchOnWindowFocus: true, // 포커스 시 재조회
    refetchOnReconnect: true, // 재연결 시 재조회
  });
}

/**
 * 홈페이지 후기 섹션용 Featured 응원 메시지 조회
 */
export function useFeaturedMessages(limit: number = 3) {
  return useQuery({
    queryKey: ['featured-messages', limit],
    queryFn: () => donationsApi.getFeaturedMessages(limit),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchOnWindowFocus: false, // 포커스 시 재조회 안 함 (자주 변경되지 않음)
  });
}

/**
 * 기부 메시지의 Featured 상태 토글 (관리자용)
 */
export function useToggleFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ donationId, isFeatured }: { donationId: number; isFeatured: boolean }) =>
      donationsApi.toggleFeatured(donationId, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-messages'] });
      queryClient.invalidateQueries({ queryKey: ['project-donations'] });
    },
  });
}

/**
 * 프로젝트별 기부 내역
 */
export function useProjectDonations(projectId: number) {
  return useQuery({
    queryKey: ['project-donations', projectId],
    queryFn: () => donationsApi.getProjectDonations(projectId),
    enabled: !!projectId,
  });
}

/**
 * 프로젝트 기부자 목록 (projects API 사용)
 */
export function useDonors(projectId: number) {
  return useQuery({
    queryKey: ['project-donors', projectId],
    queryFn: () => getProjectDonors(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });
}

/**
 * 기부하기 (alias)
 */
export function useDonate() {
  return useCreateDonation();
}

/**
 * 영수증 조회
 */
export function useReceipt(receiptNumber: string) {
  return useQuery({
    queryKey: ['receipt', receiptNumber],
    queryFn: () => donationsApi.getReceipt(receiptNumber),
    enabled: !!receiptNumber,
  });
}

/**
 * 기부하기
 */
export function useCreateDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: donationsApi.createDonation,
    onSuccess: () => {
      // 기부 후 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['recent-donations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

/**
 * 결제 요청
 */
export function useCreatePayment() {
  return useMutation({
    mutationFn: donationsApi.createPayment,
  });
}

/**
 * 결제 확인
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: donationsApi.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
    },
  });
}

/**
 * 영수증 PDF 다운로드
 */
export function useDownloadReceiptPdf() {
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      const blob = await donationsApi.downloadReceiptPdf(receiptNumber);

      // Blob을 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `기부금영수증_${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

// ==================== 관리자용 Hooks ====================

/**
 * 관리자용 전체 기부 내역 조회 (필터 지원)
 */
export function useAdminDonations(filters: donationsApi.AdminDonationFilters = {}) {
  return useQuery({
    queryKey: ['admin-donations', filters],
    queryFn: () => donationsApi.getAdminDonations(filters),
    staleTime: 1 * 60 * 1000, // 1분간 캐시
    refetchOnWindowFocus: true,
  });
}
