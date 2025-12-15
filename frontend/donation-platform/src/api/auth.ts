// import { apiClient } from '../lib/apiClient';
// import type { UserType } from '../types';

// // ==================== 요청 타입 ====================
// export interface SignupRequest {
//   email: string;
//   password: string;
//   userName: string;
//   phone?: string;
//   userType: UserType;
//   // 기관 회원인 경우
//   organizationName?: string;
//   businessNumber?: string;
//   representativeName?: string;
// }

// export interface LoginRequest {
//   email: string;
//   password: string;
//   rememberMe?: boolean;
// }

// export interface ChangePasswordRequest {
//   currentPassword: string;
//   newPassword: string;
// }

// // ==================== 응답 타입 ====================
// export interface AuthResponse {
//   token: string;
//   user: {
//     userId: number;
//     email: string;
//     userName: string;
//     userType: UserType;
//     phone?: string;
//     profileImageUrl?: string;
//   };
// }

// export interface ApiErrorResponse {
//   error: string;
//   message: string;
//   timestamp: string;
// }

// // ==================== API 함수 ====================

// /**
//  * 회원가입
//  */
// export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
//   return apiClient.post<AuthResponse>('/auth/signup', data);
// };

// /**
//  * 로그인
//  */
// export const login = async (data: LoginRequest): Promise<AuthResponse> => {
//   return apiClient.post<AuthResponse>('/auth/login', data);
// };

// /**
//  * 로그아웃
//  */
// export const logout = async (): Promise<void> => {
//   return apiClient.post<void>('/auth/logout');
// };

// /**
//  * 토큰 갱신
//  */
// export const refreshToken = async (): Promise<AuthResponse> => {
//   return apiClient.post<AuthResponse>('/auth/refresh');
// };

// /**
//  * 비밀번호 변경
//  */
// export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
//   return apiClient.post<void>('/auth/change-password', data);
// };

// /**
//  * 이메일 중복 확인
//  */
// export const checkEmailAvailability = async (email: string): Promise<boolean> => {
//   return apiClient.get<boolean>(`/auth/check-email?email=${encodeURIComponent(email)}`);
// };


//이메일 인증 안돼서 우선 일부 변경
import { apiClient } from '../lib/apiClient';
import type { UserType } from '../types';

// ==================== 공통 ApiResponse 타입 ====================
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errorCode?: string;
}

// ==================== 요청 타입 ====================
export interface SignupRequest {
  email: string;
  password: string;
  userName: string;
  phone?: string;
  userType: UserType;
  // 기관 회원인 경우
  organizationName?: string;
  businessNumber?: string;
  representativeName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==================== 응답 타입 ====================
export interface AuthResponse {
  token: string | null;
  user: {
    userId: number;
    email: string;
    userName: string;
    userType: UserType;
    phone?: string;
    profileImage?: string;  // 프로필 이미지 URL
    organizationName?: string;
    businessNumber?: string;
    representativeName?: string;
    createdAt?: string;
  };
  isRejected?: boolean; // 승인 거부 여부
  profileIncomplete?: boolean; // 프로필 미완성 여부 (기관 사용자)
  rejectionInfo?: {
    rejectionReason: string; // 거부 사유
    rejectionFields: string; // 거부된 필드 목록 (JSON)
    lastRejectedAt: string; // 마지막 거부 일시
  };
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}

// ==================== API 함수 ====================

/**
 * 회원가입
 * 백엔드가 @RequestPart("data")를 기대하므로 항상 FormData로 전송
 */
export const signup = async (data: SignupRequest | FormData): Promise<AuthResponse> => {
  // FormData인 경우 그대로 전송
  if (data instanceof FormData) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // 일반 객체인 경우 FormData로 변환하여 전송
  const requestData = {
    ...data,
    userType: data.userType.toUpperCase() as 'INDIVIDUAL' | 'ORGANIZATION' | 'ADMIN'
  };

  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * 로그인
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return response.data;
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  await apiClient.post<ApiResponse<void>>('/auth/logout');
};

/**
 * 토큰 갱신
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
  return response.data;
};

/**
 * 비밀번호 변경
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.post<ApiResponse<void>>('/auth/change-password', data);
};

/**
 * 이메일 중복 확인
 * @returns true면 사용 가능, false면 중복
 */
export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  const response = await apiClient.get<ApiResponse<boolean>>(
    `/auth/check-email?email=${encodeURIComponent(email)}`
  );
  return response.data;  // ✅ ApiResponse의 data 필드에서 boolean 추출
};

// ==================== 비밀번호 찾기/재설정 API ====================

export interface PasswordResetRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerificationCodeResponse {
  message: string;
  expiresInSeconds: number;
}

export interface VerifyCodeResponse {
  verified: boolean;
  message: string;
  remainingSeconds?: number;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * 비밀번호 찾기 - 이메일 존재 여부 확인
 * @returns true면 가입된 이메일, false면 가입되지 않은 이메일
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const response = await apiClient.post<ApiResponse<boolean>>(
    '/auth/password/check-email',
    { email }
  );
  return response.data;
};

/**
 * 비밀번호 찾기 - 인증번호 발송
 */
export const sendPasswordResetCode = async (email: string): Promise<VerificationCodeResponse> => {
  const response = await apiClient.post<ApiResponse<VerificationCodeResponse>>(
    '/auth/password/send-code',
    { email }
  );
  return response.data;
};

/**
 * 비밀번호 찾기 - 인증번호 확인
 */
export const verifyPasswordResetCode = async (email: string, code: string): Promise<VerifyCodeResponse> => {
  const response = await apiClient.post<ApiResponse<VerifyCodeResponse>>(
    '/auth/password/verify-code',
    { email, code }
  );
  return response.data;
};

/**
 * 비밀번호 재설정
 */
export const resetPassword = async (data: PasswordResetRequest): Promise<PasswordResetResponse> => {
  const response = await apiClient.post<ApiResponse<PasswordResetResponse>>(
    '/auth/password/reset',
    data
  );
  return response.data;
};