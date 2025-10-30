import { apiClient } from '../lib/apiClient';

// ==================== 요청 타입 ====================
export interface UpdateProfileRequest {
  userName?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  profileImageUrl?: string;
}

export interface UpdateNotificationSettingsRequest {
  donation?: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  comment?: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  project?: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  settlement?: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  deadline?: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
}

// ==================== 응답 타입 ====================
export interface UserProfileResponse {
  userId: number;
  email: string;
  userName: string;
  phone?: string;
  userType: string;
  address?: string;
  birthDate?: string;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface NotificationSettingsResponse {
  donation: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  comment: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  project: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  settlement: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
  deadline: { enabled: boolean; email: boolean; sms: boolean; push: boolean };
}

// ==================== API 함수 ====================

/**
 * 내 프로필 조회
 */
export const getMyProfile = async (): Promise<UserProfileResponse> => {
  return apiClient.get<UserProfileResponse>('/users/profile');
};

/**
 * 프로필 수정
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
  return apiClient.put<UserProfileResponse>('/users/profile', data);
};

/**
 * 프로필 이미지 업로드
 */
export const uploadProfileImage = async (file: File): Promise<{ imageUrl: string }> => {
  return apiClient.uploadFile<{ imageUrl: string }>('/users/profile/image', file);
};

/**
 * 알림 설정 조회
 */
export const getNotificationSettings = async (): Promise<NotificationSettingsResponse> => {
  return apiClient.get<NotificationSettingsResponse>('/users/notification-settings');
};

/**
 * 알림 설정 수정
 */
export const updateNotificationSettings = async (
  data: UpdateNotificationSettingsRequest
): Promise<NotificationSettingsResponse> => {
  return apiClient.put<NotificationSettingsResponse>('/users/notification-settings', data);
};
