import { apiClient } from '../lib/apiClient';

// ==================== 요청 타입 ====================
export interface CreatePostRequest {
  type: 'NOTICE' | 'QUESTION' | 'SUPPORT' | 'GENERAL';
  title: string;
  content: string;
  images?: File[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: number; // 대댓글용
  replyToCommentId?: number; // 답글 대상 댓글 ID (대댓글에 답글 시)
}

export interface PostFilters {
  type?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

// ==================== 응답 타입 ====================
export interface PostResponse {
  postId: number;
  type: 'NOTICE' | 'QUESTION' | 'SUPPORT' | 'GENERAL';
  title: string;
  content: string;
  author: {
    userId: number;
    userName: string;
    userType: string;
  };
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isLiked: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
  createdAt: string;
  updatedAt?: string;
  images?: Array<{
    imageId: number;
    imageUrl: string;
    caption?: string;
  }>;
}

export interface CommentResponse {
  commentId: number;
  postId: number;
  content: string;
  author: {
    userId: number;
    userName: string;
    userType: string;
  };
  likeCount: number;
  isLiked: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: number;
  replyToCommentId?: number; // 답글 대상 댓글 ID
  replyToAuthor?: { // 답글 대상 사용자 정보
    userId: number;
    userName: string;
    userType: string;
  };
  replies?: CommentResponse[];
}

// ==================== API 함수 ====================

/**
 * 게시글 목록 조회
 */
export const getPosts = async (
  filters: PostFilters = {}
): Promise<{ content: PostResponse[]; totalPages: number; currentPage: number }> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get<{ data: { content: PostResponse[]; totalPages: number; currentPage: number } }>(`/posts?${params.toString()}`);
  return response.data;
};

/**
 * 게시글 상세 조회
 */
export const getPost = async (id: number): Promise<PostResponse> => {
  const response = await apiClient.get<{ data: PostResponse }>(`/posts/${id}`);
  return response.data;
};

/**
 * 게시글 작성
 */
export const createPost = async (data: CreatePostRequest): Promise<PostResponse> => {
  // 백엔드가 @RequestParam으로 받으므로 항상 FormData 사용
  const formData = new FormData();
  formData.append('type', data.type);
  formData.append('title', data.title);
  formData.append('content', data.content);

  // 이미지가 있으면 추가
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await apiClient.post<{ data: PostResponse }>('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 게시글 수정
 */
export const updatePost = async (id: number, data: UpdatePostRequest): Promise<PostResponse> => {
  const response = await apiClient.put<{ data: PostResponse }>(`/posts/${id}`, data);
  return response.data;  // ApiResponse 언래핑
};

/**
 * 게시글 삭제
 */
export const deletePost = async (id: number): Promise<void> => {
  return apiClient.delete<void>(`/posts/${id}`);
};

/**
 * 게시글 좋아요
 */
export const likePost = async (id: number): Promise<PostResponse> => {
  const response = await apiClient.post<{ data: PostResponse }>(`/posts/${id}/like`);
  return response.data;  // ApiResponse 언래핑
};

/**
 * 댓글 목록 조회
 */
export const getComments = async (postId: number): Promise<CommentResponse[]> => {
  const response = await apiClient.get<{ data: CommentResponse[] }>(`/posts/${postId}/comments`);
  return response.data;
};

/**
 * 댓글 작성
 */
export const createComment = async (
  postId: number,
  data: CreateCommentRequest
): Promise<CommentResponse> => {
  const response = await apiClient.post<{ data: CommentResponse }>(`/posts/${postId}/comments`, data);
  return response.data;  // ApiResponse 언래핑
};

/**
 * 댓글 수정
 */
export const updateComment = async (
  commentId: number,
  content: string
): Promise<CommentResponse> => {
  const response = await apiClient.put<{ data: CommentResponse }>(`/comments/${commentId}`, { content });
  return response.data;  // ApiResponse 언래핑
};

/**
 * 댓글 삭제
 */
export const deleteComment = async (commentId: number): Promise<void> => {
  return apiClient.delete<void>(`/comments/${commentId}`);
};

/**
 * 댓글 좋아요
 */
export const likeComment = async (commentId: number): Promise<CommentResponse> => {
  const response = await apiClient.post<{ data: CommentResponse }>(`/comments/${commentId}/like`);
  return response.data;  // ApiResponse 언래핑
};
