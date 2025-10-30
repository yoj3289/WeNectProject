import { apiClient } from '../lib/apiClient';

// ==================== 응답 타입 ====================
export interface NotificationResponse {
  notificationId: number;
  type: string;
  category: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

// ==================== API 함수 ====================

/**
 * 나의 알림 목록
 */
export const getMyNotifications = async (): Promise<NotificationResponse[]> => {
  return apiClient.get<NotificationResponse[]>('/notifications');
};

/**
 * 읽지 않은 알림 개수
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
  return apiClient.get<{ count: number }>('/notifications/unread-count');
};

/**
 * 알림 읽음 처리
 */
export const markAsRead = async (id: number): Promise<void> => {
  return apiClient.put<void>(`/notifications/${id}/read`);
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllAsRead = async (): Promise<void> => {
  return apiClient.put<void>('/notifications/read-all');
};

/**
 * 알림 삭제
 */
export const deleteNotification = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`/notifications/${id}`);
};
