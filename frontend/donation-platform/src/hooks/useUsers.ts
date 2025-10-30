import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../api/users';

/**
 * 내 프로필 조회
 */
export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: usersApi.getMyProfile,
  });
}

/**
 * 프로필 수정
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

/**
 * 프로필 이미지 업로드
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.uploadProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

/**
 * 알림 설정 조회
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: usersApi.getNotificationSettings,
  });
}

/**
 * 알림 설정 수정
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}
