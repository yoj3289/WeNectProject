/**
 * 프로젝트 상태 관련 유틸리티 함수
 * - 모든 페이지에서 일관된 상태 표시를 위한 공통 함수
 */

export type ProjectStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SETTLEMENT'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REJECTED';

/**
 * 프로젝트 상태 라벨
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인됨',
  ACTIVE: '진행 중',
  COMPLETED: '모금 완료',
  SETTLEMENT: '결산 진행 중',
  CLOSED: '종료',
  CANCELLED: '취소됨',
  REJECTED: '반려됨',
};

/**
 * 프로젝트 상태별 색상 스타일
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; gradient: string; border: string }> = {
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    gradient: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-200'
  },
  APPROVED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200'
  },
  ACTIVE: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    gradient: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200'
  },
  COMPLETED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200'
  },
  SETTLEMENT: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    gradient: 'from-orange-50 to-amber-50',
    border: 'border-orange-200'
  },
  CLOSED: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    gradient: 'from-gray-50 to-slate-50',
    border: 'border-gray-200'
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    gradient: 'from-red-50 to-pink-50',
    border: 'border-red-200'
  },
  REJECTED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    gradient: 'from-red-50 to-pink-50',
    border: 'border-red-200'
  },
};

/**
 * 프로젝트 상태 라벨 반환
 * @param status 프로젝트 상태 (대소문자 무관)
 * @returns 한글 상태 라벨
 */
export function getProjectStatusLabel(status: string | undefined): string {
  if (!status) return '알 수 없음';

  const upperStatus = status.toUpperCase() as ProjectStatus;
  return PROJECT_STATUS_LABELS[upperStatus] || status;
}

/**
 * 프로젝트 상태 배지 스타일 반환
 * @param status 프로젝트 상태 (대소문자 무관)
 * @returns Tailwind CSS 클래스 문자열
 */
export function getProjectStatusBadgeStyle(status: string | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-800';

  const upperStatus = status.toUpperCase() as ProjectStatus;
  const colors = PROJECT_STATUS_COLORS[upperStatus] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  return `${colors.bg} ${colors.text}`;
}

/**
 * 프로젝트 상태 박스 스타일 반환 (gradient + border + text)
 * @param status 프로젝트 상태 (대소문자 무관)
 * @returns Gradient, Border, Text 색상 객체
 */
export function getProjectStatusBoxStyle(status: string | undefined): {
  gradient: string;
  border: string;
  text: string;
} {
  if (!status) {
    return {
      gradient: 'from-gray-50 to-slate-50',
      border: 'border-gray-200',
      text: 'text-gray-800'
    };
  }

  const upperStatus = status.toUpperCase() as ProjectStatus;
  const colors = PROJECT_STATUS_COLORS[upperStatus] || {
    gradient: 'from-gray-50 to-slate-50',
    border: 'border-gray-200',
    text: 'text-gray-800'
  };

  return {
    gradient: colors.gradient,
    border: colors.border,
    text: colors.text
  };
}

/**
 * 프로젝트 수정 가능 여부 확인
 * @param status 프로젝트 상태 (대소문자 무관)
 * @returns 수정 가능 여부
 */
export function canEditProject(status: string | undefined): boolean {
  if (!status) return false;

  const upperStatus = status.toUpperCase();
  const nonEditableStatuses = ['CLOSED', 'CANCELLED', 'REJECTED'];

  return !nonEditableStatuses.includes(upperStatus);
}

/**
 * 프로젝트 상태에 따른 설명 텍스트 반환
 * @param status 프로젝트 상태 (대소문자 무관)
 * @returns 상태 설명
 */
export function getProjectStatusDescription(status: string | undefined): string {
  if (!status) return '';

  const upperStatus = status.toUpperCase() as ProjectStatus;

  const descriptions: Record<ProjectStatus, string> = {
    PENDING: '관리자의 승인을 기다리고 있습니다',
    APPROVED: '프로젝트가 승인되었습니다',
    ACTIVE: '현재 후원을 받고 있습니다',
    COMPLETED: '목표 금액을 달성했습니다',
    SETTLEMENT: '후원금 사용 내역을 정산 중입니다',
    CLOSED: '프로젝트가 종료되었습니다',
    CANCELLED: '프로젝트가 취소되었습니다',
    REJECTED: '관리자에 의해 반려되었습니다',
  };

  return descriptions[upperStatus] || '';
}
