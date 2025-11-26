package com.wenect.donation_paltform.domain.community.service;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.community.dto.AuthorDto;
import com.wenect.donation_paltform.domain.community.dto.CommentResponse;
import com.wenect.donation_paltform.domain.community.dto.CreateCommentRequest;
import com.wenect.donation_paltform.domain.community.dto.UpdateCommentRequest;
import com.wenect.donation_paltform.domain.community.entity.Comment;
import com.wenect.donation_paltform.domain.community.entity.CommentLike;
import com.wenect.donation_paltform.domain.community.entity.Post;
import com.wenect.donation_paltform.domain.community.repository.CommentLikeRepository;
import com.wenect.donation_paltform.domain.community.repository.CommentRepository;
import com.wenect.donation_paltform.domain.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;

    /**
     * 게시글의 댓글 목록 조회 (트리 구조) - 비로그인
     */
    public List<CommentResponse> getComments(Long postId) {
        return getComments(postId, null);
    }

    /**
     * 게시글의 댓글 목록 조회 (트리 구조) - 로그인 사용자
     */
    public List<CommentResponse> getComments(Long postId, Long currentUserId) {
        // 게시글 존재 확인
        postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 모든 댓글 조회
        List<Comment> allComments = commentRepository.findByPostId(postId);

        // 최상위 댓글과 대댓글 분리
        List<Comment> topLevelComments = allComments.stream()
                .filter(c -> c.getParentCommentId() == null)
                .collect(Collectors.toList());

        Map<Long, List<Comment>> repliesMap = allComments.stream()
                .filter(c -> c.getParentCommentId() != null)
                .collect(Collectors.groupingBy(Comment::getParentCommentId));

        // 트리 구조로 변환 (currentUserId 전달하여 isLiked 상태 확인)
        return topLevelComments.stream()
                .map(comment -> convertToResponse(comment, repliesMap, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * 댓글 작성
     */
    @Transactional
    public CommentResponse createComment(Long userId, Long postId, CreateCommentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Post post = postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 부모 댓글 존재 확인 (대댓글인 경우)
        if (request.getParentCommentId() != null) {
            commentRepository.findByIdAndNotDeleted(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .post(post)
                .userId(userId)
                .content(request.getContent())
                .parentCommentId(request.getParentCommentId())
                .replyToCommentId(request.getReplyToCommentId())
                .build();

        comment = commentRepository.save(comment);

        return convertToResponse(comment, null, userId);
    }

    /**
     * 댓글 수정
     */
    @Transactional
    public CommentResponse updateComment(Long userId, Long commentId, UpdateCommentRequest request) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 권한 확인
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("댓글을 수정할 권한이 없습니다.");
        }

        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);

        return convertToResponse(comment, null);
    }

    /**
     * 댓글 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 권한 확인 (작성자 또는 관리자)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!comment.getUserId().equals(userId) && user.getUserType() != User.UserType.ADMIN) {
            throw new IllegalArgumentException("댓글을 삭제할 권한이 없습니다.");
        }

        comment.softDelete();
        commentRepository.save(comment);
    }

    /**
     * 댓글 좋아요 토글
     */
    @Transactional
    public CommentResponse toggleLike(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 이미 좋아요를 눌렀는지 확인
        Optional<CommentLike> existingLike = commentLikeRepository.findByCommentIdAndUserId(commentId, userId);

        if (existingLike.isPresent()) {
            // 좋아요 취소
            commentLikeRepository.delete(existingLike.get());
            comment.decrementLikeCount();
        } else {
            // 좋아요 추가
            CommentLike commentLike = CommentLike.builder()
                    .commentId(commentId)
                    .userId(userId)
                    .build();
            commentLikeRepository.save(commentLike);
            comment.incrementLikeCount();
        }

        comment = commentRepository.save(comment);
        return convertToResponse(comment, null, userId);
    }

    /**
     * Comment -> CommentResponse 변환 (userId 없이)
     */
    private CommentResponse convertToResponse(Comment comment, Map<Long, List<Comment>> repliesMap) {
        return convertToResponse(comment, repliesMap, null);
    }

    /**
     * Comment -> CommentResponse 변환 (userId 포함)
     */
    private CommentResponse convertToResponse(Comment comment, Map<Long, List<Comment>> repliesMap, Long currentUserId) {
        User user = userRepository.findById(comment.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        AuthorDto author = AuthorDto.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userType(user.getUserType().name())
                .build();

        // 현재 사용자가 좋아요를 눌렀는지 확인
        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = commentLikeRepository.existsByCommentIdAndUserId(comment.getCommentId(), currentUserId);
        }

        // 답글 대상 사용자 정보 조회
        AuthorDto replyToAuthor = null;
        if (comment.getReplyToCommentId() != null) {
            Comment replyToComment = commentRepository.findByIdAndNotDeleted(comment.getReplyToCommentId()).orElse(null);
            if (replyToComment != null) {
                User replyToUser = userRepository.findById(replyToComment.getUserId()).orElse(null);
                if (replyToUser != null) {
                    replyToAuthor = AuthorDto.builder()
                            .userId(replyToUser.getUserId())
                            .userName(replyToUser.getUserName())
                            .userType(replyToUser.getUserType().name())
                            .build();
                }
            }
        }

        CommentResponse response = CommentResponse.builder()
                .commentId(comment.getCommentId())
                .postId(comment.getPost().getPostId())
                .content(comment.getContent())
                .author(author)
                .likeCount(comment.getLikeCount())
                .isLiked(isLiked)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .parentCommentId(comment.getParentCommentId())
                .replyToCommentId(comment.getReplyToCommentId())
                .replyToAuthor(replyToAuthor)
                .replies(new ArrayList<>())
                .build();

        // 대댓글 추가
        if (repliesMap != null && repliesMap.containsKey(comment.getCommentId())) {
            List<CommentResponse> replies = repliesMap.get(comment.getCommentId()).stream()
                    .map(reply -> convertToResponse(reply, null, currentUserId))
                    .collect(Collectors.toList());
            response.setReplies(replies);
        }

        return response;
    }
}