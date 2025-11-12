package com.wenect.donation_paltform.domain.favorite.repository;

import com.wenect.donation_paltform.domain.favorite.entity.FavoriteProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 관심 프로젝트 Repository
 */
@Repository
public interface FavoriteProjectRepository extends JpaRepository<FavoriteProject, Long> {

    /**
     * 사용자와 프로젝트로 관심 프로젝트 찾기
     */
    Optional<FavoriteProject> findByUser_UserIdAndProject_ProjectId(Long userId, Long projectId);

    /**
     * 사용자의 관심 프로젝트 존재 여부 확인
     */
    boolean existsByUser_UserIdAndProject_ProjectId(Long userId, Long projectId);

    /**
     * 사용자의 관심 프로젝트 목록 조회 (최신순)
     */
    @Query("SELECT f FROM FavoriteProject f " +
            "JOIN FETCH f.project p " +
            "WHERE f.user.userId = :userId " +
            "ORDER BY f.createdAt DESC")
    List<FavoriteProject> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    /**
     * 프로젝트의 관심 등록 수 조회
     */
    @Query("SELECT COUNT(f) FROM FavoriteProject f WHERE f.project.projectId = :projectId")
    Long countByProjectId(@Param("projectId") Long projectId);

    /**
     * 관심 등록 수가 많은 프로젝트 ID 목록 조회
     */
    @Query("SELECT f.project.projectId " +
            "FROM FavoriteProject f " +
            "GROUP BY f.project.projectId " +
            "ORDER BY COUNT(f) DESC")
    List<Long> findTopProjectIdsByFavoriteCount();
}
