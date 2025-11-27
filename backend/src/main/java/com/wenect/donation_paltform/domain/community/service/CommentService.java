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
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final NotificationService notificationService;

    /**
     * 게시글의 댓글 목록 조회 (트리 구조) - 비로그인
     */
    public List<CommentResponse> getComments(Long postId) {
        return getComments(postId, null);
    }

    /**
     * 게시글의 댓글 목록 조회 (트리 구조, 페이지네이션) - 로그인 사용자
     * 삭제된 부모 댓글이라도 대댓글이 있으면 "[삭제된 댓글]"로 표시
     *
     * @param postId 게시글 ID
     * @param currentUserId 현재 로그인 사용자 ID (nullable)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 페이지네이션된 댓글 목록
     */
    public PageResponse<CommentResponse> getCommentsPaged(Long postId, Long currentUserId, int page, int size) {
        // 게시글 존재 확인
        postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        Pageable pageable = PageRequest.of(page, size);

        // 최상위 댓글만 페이지네이션 조회
        Page<Comment> topLevelCommentsPage = commentRepository.findTopLevelCommentsByPostId(postId, pageable);

        // 삭제되지 않은 모든 대댓글 조회 (페이지네이션된 최상위 댓글의 대댓글만)
        List<Long> topLevelCommentIds = topLevelCommentsPage.getContent().stream()
                .map(Comment::getCommentId)
                .collect(Collectors.toList());

        // 대댓글 조회
        List<Comment> allReplies = new ArrayList<>();
        for (Long parentId : topLevelCommentIds) {
            allReplies.addAll(commentRepository.findRepliesByParentId(parentId));
        }

        // 대댓글 맵 생성
        Map<Long, List<Comment>> repliesMap = allReplies.stream()
                .collect(Collectors.groupingBy(Comment::getParentCommentId));

        // 트리 구조로 변환
        List<CommentResponse> content = topLevelCommentsPage.getContent().stream()
                .map(comment -> convertToResponse(comment, repliesMap, currentUserId))
                .collect(Collectors.toList());

        return PageResponse.<CommentResponse>builder()
                .content(content)
                .currentPage(topLevelCommentsPage.getNumber())
                .totalPages(topLevelCommentsPage.getTotalPages())
                .totalElements(topLevelCommentsPage.getTotalElements())
                .size(topLevelCommentsPage.getSize())
                .build();
    }

    /**
     * 게시글의 댓글 목록 조회 (트리 구조) - 로그인 사용자 (기존 메서드 유지)
     * 삭제된 부모 댓글이라도 대댓글이 있으면 "[삭제된 댓글]"로 표시
     */
    public List<CommentResponse> getComments(Long postId, Long currentUserId) {
        // 게시글 존재 확인
        postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 모든 댓글 조회 (삭제된 것 포함)
        List<Comment> allComments = commentRepository.findAllByPostIdIncludingDeleted(postId);

        // 삭제되지 않은 대댓글 목록
        List<Comment> activeReplies = allComments.stream()
                .filter(c -> c.getParentCommentId() != null && !c.getIsDeleted())
                .collect(Collectors.toList());

        // 대댓글이 있는 부모 댓글 ID 집합
        java.util.Set<Long> parentIdsWithReplies = activeReplies.stream()
                .map(Comment::getParentCommentId)
                .collect(java.util.stream.Collectors.toSet());

        // 최상위 댓글 필터링:
        // - 삭제되지 않은 댓글
        // - 또는 삭제되었지만 대댓글이 있는 댓글
        List<Comment> topLevelComments = allComments.stream()
                .filter(c -> c.getParentCommentId() == null)
                .filter(c -> !c.getIsDeleted() || parentIdsWithReplies.contains(c.getCommentId()))
                .collect(Collectors.toList());

        // 대댓글 맵 (삭제되지 않은 것만)
        Map<Long, List<Comment>> repliesMap = activeReplies.stream()
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
        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findByIdAndNotDeleted(request.getParentCommentId())
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

        // 알림 생성
        try {
            sendCommentNotifications(user, post, comment, parentComment, request.getReplyToCommentId());
        } catch (Exception e) {
            log.error("댓글 알림 전송 실패", e);
            // 알림 실패해도 댓글 작성은 성공으로 처리
        }

        return convertToResponse(comment, null, userId);
    }

    /**
     * 댓글 알림 전송
     */
    private void sendCommentNotifications(User commenter, Post post, Comment comment,
                                          Comment parentComment, Long replyToCommentId) {
        String commenterName = commenter.getUserName();
        String postTitle = post.getTitle().length() > 20
                ? post.getTitle().substring(0, 20) + "..."
                : post.getTitle();
        String commentPreview = comment.getContent().length() > 30
                ? comment.getContent().substring(0, 30) + "..."
                : comment.getContent();
        String link = "/community/" + post.getPostId() + "#comment-" + comment.getCommentId();

        // 게시글 작성자 정보
        User postAuthor = userRepository.findById(post.getUserId()).orElse(null);

        if (parentComment == null) {
            // 일반 댓글인 경우: 게시글 작성자에게 알림
            if (postAuthor != null && !postAuthor.getUserId().equals(commenter.getUserId())) {
                notificationService.createNotification(
                        postAuthor.getUserId(),
                        "comment",
                        "community",
                        "새 댓글이 달렸습니다",
                        String.format("%s님이 '%s' 게시글에 댓글을 남겼습니다: \"%s\"",
                                commenterName, postTitle, commentPreview),
                        link,
                        Map.of("postId", post.getPostId().toString(), "commentId", comment.getCommentId().toString())
                );
            }
        } else {
            // 대댓글인 경우
            User parentCommentAuthor = userRepository.findById(parentComment.getUserId()).orElse(null);

            // 1. 부모 댓글 작성자에게 알림 (본인이 아닌 경우)
            if (parentCommentAuthor != null && !parentCommentAuthor.getUserId().equals(commenter.getUserId())) {
                notificationService.createNotification(
                        parentCommentAuthor.getUserId(),
                        "reply",
                        "community",
                        "답글이 달렸습니다",
                        String.format("%s님이 회원님의 댓글에 답글을 남겼습니다: \"%s\"",
                                commenterName, commentPreview),
                        link,
                        Map.of("postId", post.getPostId().toString(), "commentId", comment.getCommentId().toString())
                );
            }

            // 2. 특정 사용자를 언급한 경우 (replyToCommentId가 있는 경우)
            if (replyToCommentId != null && !replyToCommentId.equals(parentComment.getCommentId())) {
                Comment replyToComment = commentRepository.findByIdAndNotDeleted(replyToCommentId).orElse(null);
                if (replyToComment != null) {
                    User replyToUser = userRepository.findById(replyToComment.getUserId()).orElse(null);
                    // 부모 댓글 작성자와 다른 사용자이고, 본인이 아닌 경우에만 알림
                    if (replyToUser != null
                            && !replyToUser.getUserId().equals(commenter.getUserId())
                            && !replyToUser.getUserId().equals(parentCommentAuthor != null ? parentCommentAuthor.getUserId() : null)) {
                        notificationService.createNotification(
                                replyToUser.getUserId(),
                                "reply",
                                "community",
                                "답글이 달렸습니다",
                                String.format("%s님이 회원님을 언급했습니다: \"%s\"",
                                        commenterName, commentPreview),
                                link,
                                Map.of("postId", post.getPostId().toString(), "commentId", comment.getCommentId().toString())
                        );
                    }
                }
            }

            // 3. 게시글 작성자에게도 알림 (부모 댓글 작성자와 다르고, 본인이 아닌 경우)
            if (postAuthor != null
                    && !postAuthor.getUserId().equals(commenter.getUserId())
                    && (parentCommentAuthor == null || !postAuthor.getUserId().equals(parentCommentAuthor.getUserId()))) {
                notificationService.createNotification(
                        postAuthor.getUserId(),
                        "reply",
                        "community",
                        "게시글에 새 답글이 달렸습니다",
                        String.format("%s님이 '%s' 게시글에 답글을 남겼습니다: \"%s\"",
                                commenterName, postTitle, commentPreview),
                        link,
                        Map.of("postId", post.getPostId().toString(), "commentId", comment.getCommentId().toString())
                );
            }
        }
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
     * 삭제된 댓글은 "[삭제된 댓글]"로 표시
     */
    private CommentResponse convertToResponse(Comment comment, Map<Long, List<Comment>> repliesMap, Long currentUserId) {
        // 삭제된 댓글 처리
        boolean isDeleted = comment.getIsDeleted();

        AuthorDto author;
        String content;
        int likeCount;
        boolean isLiked = false;

        if (isDeleted) {
            // 삭제된 댓글: 작성자 정보 숨김, 내용을 "[삭제된 댓글]"로 표시
            author = AuthorDto.builder()
                    .userId(0L)
                    .userName("알 수 없음")
                    .userType("UNKNOWN")
                    .build();
            content = "[삭제된 댓글입니다]";
            likeCount = 0;
        } else {
            // 정상 댓글
            User user = userRepository.findById(comment.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            author = AuthorDto.builder()
                    .userId(user.getUserId())
                    .userName(user.getUserName())
                    .userType(user.getUserType().name())
                    .build();
            content = comment.getContent();
            likeCount = comment.getLikeCount();

            // 현재 사용자가 좋아요를 눌렀는지 확인
            if (currentUserId != null) {
                isLiked = commentLikeRepository.existsByCommentIdAndUserId(comment.getCommentId(), currentUserId);
            }
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
                .content(content)
                .author(author)
                .likeCount(likeCount)
                .isLiked(isLiked)
                .isDeleted(isDeleted)  // 삭제 여부 추가
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