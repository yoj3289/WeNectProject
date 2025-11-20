package com.wenect.donation_paltform.domain.community.service;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.community.dto.AuthorDto;
import com.wenect.donation_paltform.domain.community.dto.CommentResponse;
import com.wenect.donation_paltform.domain.community.dto.CreateCommentRequest;
import com.wenect.donation_paltform.domain.community.dto.UpdateCommentRequest;
import com.wenect.donation_paltform.domain.community.entity.Comment;
import com.wenect.donation_paltform.domain.community.entity.Post;
import com.wenect.donation_paltform.domain.community.repository.CommentRepository;
import com.wenect.donation_paltform.domain.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * 게시글의 댓글 목록 조회 (트리 구조)
     */
    public List<CommentResponse> getComments(Long postId) {
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

        // 트리 구조로 변환
        return topLevelComments.stream()
                .map(comment -> convertToResponse(comment, repliesMap))
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
                .build();

        comment = commentRepository.save(comment);

        return convertToResponse(comment, null);
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
     * 댓글 좋아요 토글 (간단 구현)
     */
    @Transactional
    public CommentResponse toggleLike(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 간단 구현: 좋아요 카운트만 저장 (실제로는 comment_likes 테이블 필요)
        // 여기서는 Entity에 likeCount 필드가 없으므로 추가 필요
        // 임시로 응답만 반환

        return convertToResponse(comment, null);
    }

    /**
     * Comment -> CommentResponse 변환
     */
    private CommentResponse convertToResponse(Comment comment, Map<Long, List<Comment>> repliesMap) {
        User user = userRepository.findById(comment.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        AuthorDto author = AuthorDto.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userType(user.getUserType().name())
                .build();

        CommentResponse response = CommentResponse.builder()
                .commentId(comment.getCommentId())
                .postId(comment.getPost().getPostId())
                .content(comment.getContent())
                .author(author)
                .likeCount(0) // 좋아요 기능은 별도 테이블 필요
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .parentCommentId(comment.getParentCommentId())
                .replies(new ArrayList<>())
                .build();

        // 대댓글 추가
        if (repliesMap != null && repliesMap.containsKey(comment.getCommentId())) {
            List<CommentResponse> replies = repliesMap.get(comment.getCommentId()).stream()
                    .map(reply -> convertToResponse(reply, null))
                    .collect(Collectors.toList());
            response.setReplies(replies);
        }

        return response;
    }
}
