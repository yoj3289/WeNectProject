package com.wenect.donation_paltform.domain.community.repository;

import com.wenect.donation_paltform.domain.community.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 게시글의 모든 댓글 조회 (삭제되지 않은 것만)
    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findByPostId(@Param("postId") Long postId);

    // 최상위 댓글만 조회 (대댓글 제외)
    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId AND c.parentCommentId IS NULL AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findTopLevelCommentsByPostId(@Param("postId") Long postId);

    // 특정 댓글의 대댓글 조회
    @Query("SELECT c FROM Comment c WHERE c.parentCommentId = :parentId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId);

    // 댓글 ID로 조회 (삭제되지 않은 것만)
    @Query("SELECT c FROM Comment c WHERE c.commentId = :commentId AND c.isDeleted = false")
    Optional<Comment> findByIdAndNotDeleted(@Param("commentId") Long commentId);

    // 게시글의 댓글 개수
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.post.postId = :postId AND c.isDeleted = false")
    Long countByPostId(@Param("postId") Long postId);

    // 사용자의 댓글 조회
    @Query("SELECT c FROM Comment c WHERE c.userId = :userId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Comment> findByUserId(@Param("userId") Long userId);

    // 게시글의 모든 댓글 조회 (삭제된 것 포함 - 대댓글 표시를 위해)
    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostIdIncludingDeleted(@Param("postId") Long postId);

    // 특정 부모 댓글에 대댓글이 있는지 확인 (삭제되지 않은 대댓글만)
    @Query("SELECT COUNT(c) > 0 FROM Comment c WHERE c.parentCommentId = :parentId AND c.isDeleted = false")
    boolean hasActiveReplies(@Param("parentId") Long parentId);

    // ==================== 페이지네이션 지원 ====================

    /**
     * 최상위 댓글만 페이지네이션 조회 (대댓글 제외)
     */
    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId AND c.parentCommentId IS NULL AND c.isDeleted = false ORDER BY c.createdAt ASC")
    Page<Comment> findTopLevelCommentsByPostId(@Param("postId") Long postId, Pageable pageable);
}
