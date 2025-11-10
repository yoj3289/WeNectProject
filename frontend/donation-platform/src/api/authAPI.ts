import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth`;

export interface SignupRequest {
  email: string;
  password: string;
  userName: string;
  phone: string;
  userType: 'INDIVIDUAL' | 'ORGANIZATION' | 'ADMIN';
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    email: string;
    userName: string;
    userType: string;
  };
  errorCode: string | null;
}

// 이메일 중복 확인
export const checkEmailDuplicate = async (email: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-email`, {
      params: { email }
    });
    return response.data.data; // 사용 가능하면 true
  } catch (error) {
    console.error('이메일 중복 확인 실패:', error);
    throw error;
  }
};

// 회원가입
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};