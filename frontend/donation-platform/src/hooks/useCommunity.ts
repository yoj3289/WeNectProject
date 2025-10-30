import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as communityApi from '../api/community';

/**
 * 게시글 목록
 */
export function usePosts(filters: communityApi.PostFilters = {}) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => communityApi.getPosts(filters),
  });
}

/**
 * 게시글 상세
 */
export function usePost(id: number) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => communityApi.getPost(id),
    enabled: !!id,
  });
}

/**
 * 댓글 목록
 */
export function useComments(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => communityApi.getComments(postId),
    enabled: !!postId,
  });
}

/**
 * 게시글 작성
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communityApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

/**
 * 게시글 수정
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: communityApi.UpdatePostRequest }) =>
      communityApi.updatePost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

/**
 * 게시글 삭제
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communityApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

/**
 * 게시글 좋아요
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communityApi.likePost,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

/**
 * 댓글 작성
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: communityApi.CreateCommentRequest }) =>
      communityApi.createComment(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

/**
 * 댓글 수정
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      communityApi.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/**
 * 댓글 삭제
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communityApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/**
 * 댓글 좋아요
 */
export function useLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communityApi.likeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
