package com.wenect.donation_paltform.domain.community.repository;

import com.wenect.donation_paltform.domain.community.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostImageRepository extends JpaRepository<PostImage, Long> {

    // 게시글의 모든 이미지 조회
    @Query("SELECT pi FROM PostImage pi WHERE pi.post.postId = :postId ORDER BY pi.displayOrder ASC")
    List<PostImage> findByPostId(@Param("postId") Long postId);

    // 게시글의 이미지 개수
    @Query("SELECT COUNT(pi) FROM PostImage pi WHERE pi.post.postId = :postId")
    Long countByPostId(@Param("postId") Long postId);
}
