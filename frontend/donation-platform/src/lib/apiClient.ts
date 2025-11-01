import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * API 클라이언트
 * - 모든 HTTP 요청을 처리
 * - JWT 토큰 자동 첨부
 * - 에러 핸들링
 */
class ApiClient {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터: 토큰 자동 첨부
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터: 에러 처리
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // 토큰 만료 또는 인증 실패
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // 로컬 스토리지에서 토큰 복원
    this.loadToken();
  }

  /**
   * 토큰 설정
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  /**
   * 토큰 가져오기
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 토큰 제거
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  /**
   * 로컬 스토리지에서 토큰 로드
   */
  private loadToken(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.token = token;
    }
  }

  /**
   * GET 요청
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  /**
   * POST 요청
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  /**
   * PUT 요청
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  /**
   * DELETE 요청
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }

  /**
   * 파일 업로드 (multipart/form-data)
   */
  async uploadFile<T>(url: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response: AxiosResponse<T> = await this.axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 여러 파일 업로드
   */
  async uploadFiles<T>(url: string, files: File[], fieldName: string = 'files'): Promise<T> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    const response: AxiosResponse<T> = await this.axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

// 싱글톤 인스턴스 생성
export const apiClient = new ApiClient();
