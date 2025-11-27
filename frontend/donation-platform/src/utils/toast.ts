import toast from 'react-hot-toast';

/**
 * Toast 알림 유틸리티 함수
 * - 일관된 스타일과 동작을 보장
 * - 중복 토스트 방지 옵션 제공
 */
export const showToast = {
  /**
   * 성공 메시지
   */
  success: (message: string, id?: string) => {
    toast.success(message, { id });
  },

  /**
   * 에러 메시지
   */
  error: (message: string, id?: string) => {
    toast.error(message, { id });
  },

  /**
   * 정보 메시지
   */
  info: (message: string, id?: string) => {
    toast(message, {
      id,
      icon: 'ℹ️',
    });
  },

  /**
   * 경고 메시지
   */
  warning: (message: string, id?: string) => {
    toast(message, {
      id,
      icon: '⚠️',
      style: {
        background: '#FBBF24',
        color: '#1F2937',
      },
    });
  },

  /**
   * 로딩 상태 (Promise와 함께 사용)
   */
  loading: (message: string, id?: string) => {
    return toast.loading(message, { id });
  },

  /**
   * Promise 기반 토스트 (로딩 → 성공/에러 자동 전환)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * 토스트 제거
   */
  dismiss: (id?: string) => {
    toast.dismiss(id);
  },
};

export default showToast;
