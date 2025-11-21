package com.wenect.donation_paltform.domain.community.repository;

import com.wenect.donation_paltform.domain.community.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /**
     * 특정 게시글에 대한 특정 사용자의 좋아요 조회
     */
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);

    /**
     * 특정 게시글의 좋아요 개수
     */
    long countByPostId(Long postId);

    /**
     * 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
     */
    boolean existsByPostIdAndUserId(Long postId, Long userId);
}
