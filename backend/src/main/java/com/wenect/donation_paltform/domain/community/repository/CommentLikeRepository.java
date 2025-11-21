package com.wenect.donation_paltform.domain.community.repository;

import com.wenect.donation_paltform.domain.community.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    /**
     * 특정 댓글에 대한 특정 사용자의 좋아요 조회
     */
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    /**
     * 특정 댓글의 좋아요 개수
     */
    long countByCommentId(Long commentId);

    /**
     * 특정 사용자가 특정 댓글에 좋아요를 눌렀는지 확인
     */
    boolean existsByCommentIdAndUserId(Long commentId, Long userId);
}
