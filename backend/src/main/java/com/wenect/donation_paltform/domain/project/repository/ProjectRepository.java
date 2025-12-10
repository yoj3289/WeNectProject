package com.wenect.donation_paltform.domain.project.repository;

import com.wenect.donation_paltform.domain.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // 기관 ID로 프로젝트 조회
    List<Project> findByOrgId(Long orgId);

    // 상태별 프로젝트 조회
    List<Project> findByStatus(Project.ProjectStatus status);

    // 카테고리별 프로젝트 조회
    List<Project> findByCategoryId(Integer categoryId);

    // 제목으로 검색 (대소문자 무시, 부분 일치)
    List<Project> findByTitleContainingIgnoreCase(String keyword);

    // 상태와 제목으로 검색
    List<Project> findByStatusAndTitleContainingIgnoreCase(Project.ProjectStatus status, String keyword);

    // 상태와 카테고리로 검색
    List<Project> findByStatusAndCategoryId(Project.ProjectStatus status, Integer categoryId);

    // 상태, 카테고리, 제목으로 검색
    List<Project> findByStatusAndCategoryIdAndTitleContainingIgnoreCase(
            Project.ProjectStatus status, Integer categoryId, String keyword);

    // ==================== 정산 프로젝트 조회 ====================

    /**
     * 정산 프로젝트 전체 조회 (COMPLETED, SETTLEMENT, CLOSED)
     */
    List<Project> findByStatusIn(List<Project.ProjectStatus> statuses);

    /**
     * 카테고리별 정산 프로젝트 조회
     */
    List<Project> findByStatusInAndCategoryId(List<Project.ProjectStatus> statuses, Integer categoryId);

    /**
     * 키워드로 정산 프로젝트 검색
     */
    List<Project> findByStatusInAndTitleContainingIgnoreCase(List<Project.ProjectStatus> statuses, String keyword);

    /**
     * 카테고리 + 키워드로 정산 프로젝트 검색
     */
    List<Project> findByStatusInAndCategoryIdAndTitleContainingIgnoreCase(
            List<Project.ProjectStatus> statuses,
            Integer categoryId,
            String keyword);

    // ==================== 스케줄러용 쿼리 ====================

    /**
     * 만료된 ACTIVE 프로젝트 조회 (스케줄러 최적화)
     * - 종료일이 지난 ACTIVE 프로젝트만 조회
     * - 메모리 낭비 방지
     */
    List<Project> findByStatusAndEndDateBefore(Project.ProjectStatus status, java.time.LocalDate today);

    // ==================== 홈페이지용 쿼리 ====================

    /**
     * 모금액 순 프로젝트 조회 (홈페이지용)
     * - ACTIVE 상태이면서 모금액이 0원보다 큰 프로젝트만 조회
     * - 모금액 내림차순, 모금액이 같으면 생성일 오름차순 (먼저 생성된 것부터)
     */
    List<Project> findByStatusAndCurrentAmountGreaterThanOrderByCurrentAmountDescCreatedAtAsc(Project.ProjectStatus status, java.math.BigDecimal minAmount);

    // ==================== 페이지네이션 지원 쿼리 ====================

    /**
     * 상태별 프로젝트 조회 (페이지네이션)
     */
    Page<Project> findByStatus(Project.ProjectStatus status, Pageable pageable);

    /**
     * 상태 + 카테고리 필터 (페이지네이션)
     */
    Page<Project> findByStatusAndCategoryId(Project.ProjectStatus status, Integer categoryId, Pageable pageable);

    /**
     * 상태 + 키워드 검색 (페이지네이션)
     */
    Page<Project> findByStatusAndTitleContainingIgnoreCase(Project.ProjectStatus status, String keyword, Pageable pageable);

    /**
     * 상태 + 카테고리 + 키워드 검색 (페이지네이션)
     */
    Page<Project> findByStatusAndCategoryIdAndTitleContainingIgnoreCase(
            Project.ProjectStatus status, Integer categoryId, String keyword, Pageable pageable);

    /**
     * 정산 프로젝트 페이지네이션 (COMPLETED, SETTLEMENT, CLOSED)
     */
    Page<Project> findByStatusIn(List<Project.ProjectStatus> statuses, Pageable pageable);

    /**
     * 정산 프로젝트 + 카테고리 필터 (페이지네이션)
     */
    Page<Project> findByStatusInAndCategoryId(List<Project.ProjectStatus> statuses, Integer categoryId, Pageable pageable);

    /**
     * 정산 프로젝트 + 키워드 검색 (페이지네이션)
     */
    Page<Project> findByStatusInAndTitleContainingIgnoreCase(List<Project.ProjectStatus> statuses, String keyword, Pageable pageable);

    /**
     * 정산 프로젝트 + 카테고리 + 키워드 검색 (페이지네이션)
     */
    Page<Project> findByStatusInAndCategoryIdAndTitleContainingIgnoreCase(
            List<Project.ProjectStatus> statuses, Integer categoryId, String keyword, Pageable pageable);

    // ==================== 마감 임박 알림용 쿼리 ====================

    /**
     * 특정 날짜에 마감되는 ACTIVE 프로젝트 조회 (알림 스케줄러용)
     */
    List<Project> findByStatusAndEndDate(Project.ProjectStatus status, java.time.LocalDate targetDate);

    // ==================== 성능 최적화: 집계 쿼리 ====================

    /**
     * 상태별 프로젝트 수 조회
     */
    Long countByStatus(Project.ProjectStatus status);

    /**
     * 카테고리별 프로젝트 수 조회
     */
    @Query("SELECT p.categoryId, COUNT(p) FROM Project p GROUP BY p.categoryId")
    List<Object[]> countByCategoryId();

    /**
     * 기간 내 생성된 프로젝트 수 조회
     */
    @Query("SELECT COUNT(p) FROM Project p WHERE p.createdAt BETWEEN :start AND :end")
    Long countByCreatedAtBetween(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);

    /**
     * 기간 내 완료된 프로젝트 수 조회 (endDate 기준)
     */
    Long countByStatusAndEndDateBetween(Project.ProjectStatus status, java.time.LocalDate start, java.time.LocalDate end);

    /**
     * 주간/월간 프로젝트 생성 통계
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m-%d') as dateStr, COUNT(p) as cnt " +
            "FROM Project p " +
            "WHERE p.createdAt BETWEEN :start AND :end " +
            "GROUP BY FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m-%d') " +
            "ORDER BY dateStr")
    List<Object[]> findProjectStatsByDateRange(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);

    /**
     * 월별 프로젝트 생성 통계
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m') as monthStr, COUNT(p) as cnt " +
            "FROM Project p " +
            "WHERE p.createdAt BETWEEN :start AND :end " +
            "GROUP BY FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m') " +
            "ORDER BY monthStr")
    List<Object[]> findMonthlyProjectStats(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);

    /**
     * 전체 통계 요약 (활성/완료 프로젝트 수, 총 기부자 수, 총 기부 금액)
     */
    @Query(value = "SELECT " +
            "SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), " +
            "COALESCE(SUM(donor_count), 0), " +
            "COALESCE(SUM(current_amount), 0) " +
            "FROM projects", nativeQuery = true)
    Object[] getStatisticsSummary();
}
