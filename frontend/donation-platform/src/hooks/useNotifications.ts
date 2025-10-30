import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notifications';

/**
 * 나의 알림 목록
 */
export function useMyNotifications() {
  return useQuery({
    queryKey: ['my-notifications'],
    queryFn: notificationsApi.getMyNotifications,
    // 30초마다 자동 갱신
    refetchInterval: 30000,
  });
}

/**
 * 읽지 않은 알림 개수
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    // 30초마다 자동 갱신
    refetchInterval: 30000,
  });
}

/**
 * 알림 읽음 처리
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

/**
 * 모든 알림 읽음 처리
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

/**
 * 알림 삭제
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}
