package com.wenect.donation_paltform.domain.community.repository;

import com.wenect.donation_paltform.domain.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // 삭제되지 않은 게시글 조회
    @Query("SELECT p FROM Post p WHERE p.isDeleted = false")
    Page<Post> findAllActive(Pageable pageable);

    // 삭제되지 않은 게시글 상세 조회
    @Query("SELECT p FROM Post p WHERE p.postId = :postId AND p.isDeleted = false")
    Optional<Post> findByIdAndNotDeleted(@Param("postId") Long postId);

    // 타입별 조회
    @Query("SELECT p FROM Post p WHERE p.type = :type AND p.isDeleted = false")
    Page<Post> findByType(@Param("type") Post.PostType type, Pageable pageable);

    // 검색 (제목 + 내용)
    @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND (p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // 타입별 검색
    @Query("SELECT p FROM Post p WHERE p.type = :type AND p.isDeleted = false AND (p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<Post> searchByTypeAndKeyword(@Param("type") Post.PostType type, @Param("keyword") String keyword, Pageable pageable);

    // 사용자별 게시글 조회
    @Query("SELECT p FROM Post p WHERE p.userId = :userId AND p.isDeleted = false")
    Page<Post> findByUserId(@Param("userId") Long userId, Pageable pageable);

    // 공지사항 조회
    @Query("SELECT p FROM Post p WHERE p.isNotice = true AND p.isDeleted = false ORDER BY p.createdAt DESC")
    Page<Post> findNotices(Pageable pageable);
}
