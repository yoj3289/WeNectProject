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
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: number;
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

  return apiClient.get(`/posts?${params.toString()}`);
};

/**
 * 게시글 상세 조회
 */
export const getPost = async (id: number): Promise<PostResponse> => {
  return apiClient.get<PostResponse>(`/posts/${id}`);
};

/**
 * 게시글 작성
 */
export const createPost = async (data: CreatePostRequest): Promise<PostResponse> => {
  // 이미지가 있으면 먼저 업로드
  if (data.images && data.images.length > 0) {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('content', data.content);
    data.images.forEach((image) => {
      formData.append('images', image);
    });

    return apiClient.post<PostResponse>('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  return apiClient.post<PostResponse>('/posts', {
    type: data.type,
    title: data.title,
    content: data.content,
  });
};

/**
 * 게시글 수정
 */
export const updatePost = async (id: number, data: UpdatePostRequest): Promise<PostResponse> => {
  return apiClient.put<PostResponse>(`/posts/${id}`, data);
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
export const likePost = async (id: number): Promise<{ likeCount: number }> => {
  return apiClient.post<{ likeCount: number }>(`/posts/${id}/like`);
};

/**
 * 댓글 목록 조회
 */
export const getComments = async (postId: number): Promise<CommentResponse[]> => {
  return apiClient.get<CommentResponse[]>(`/posts/${postId}/comments`);
};

/**
 * 댓글 작성
 */
export const createComment = async (
  postId: number,
  data: CreateCommentRequest
): Promise<CommentResponse> => {
  return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, data);
};

/**
 * 댓글 수정
 */
export const updateComment = async (
  commentId: number,
  content: string
): Promise<CommentResponse> => {
  return apiClient.put<CommentResponse>(`/comments/${commentId}`, { content });
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
export const likeComment = async (commentId: number): Promise<{ likeCount: number }> => {
  return apiClient.post<{ likeCount: number }>(`/comments/${commentId}/like`);
};
