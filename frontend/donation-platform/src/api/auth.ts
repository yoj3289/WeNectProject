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
  token: string;
  user: {
    userId: number;
    email: string;
    userName: string;
    userType: UserType;
    phone?: string;
    profileImageUrl?: string;
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
 */
export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  // userType을 대문자로 변환
  const requestData = {
    ...data,
    userType: data.userType.toUpperCase() as 'INDIVIDUAL' | 'ORGANIZATION' | 'ADMIN'
  };
  
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', requestData);
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