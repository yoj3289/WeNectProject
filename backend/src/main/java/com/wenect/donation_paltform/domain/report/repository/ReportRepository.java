package com.wenect.donation_paltform.domain.report.repository;

import com.wenect.donation_paltform.domain.report.entity.Report;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportStatus;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    // 신고 ID로 조회 (삭제되지 않은 것만)
    Optional<Report> findByReportIdAndIsDeletedFalse(Long reportId);

    // 사용자가 이미 같은 대상을 신고했는지 확인
    boolean existsByUserIdAndReportedItemIdAndReportTypeAndIsDeletedFalse(
            Long userId, Long reportedItemId, ReportType reportType);

    // 상태별 신고 목록 조회
    Page<Report> findByStatusAndIsDeletedFalse(ReportStatus status, Pageable pageable);

    // 신고 유형별 목록 조회
    Page<Report> findByReportTypeAndIsDeletedFalse(ReportType reportType, Pageable pageable);

    // 특정 사용자가 신고한 목록
    Page<Report> findByUserIdAndIsDeletedFalse(Long userId, Pageable pageable);

    // 특정 사용자가 신고당한 목록
    Page<Report> findByReportedUserIdAndIsDeletedFalse(Long reportedUserId, Pageable pageable);

    // 삭제되지 않은 모든 신고 조회
    Page<Report> findByIsDeletedFalse(Pageable pageable);

    // 상태 및 유형으로 필터링
    @Query("SELECT r FROM Report r WHERE r.isDeleted = false " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:reportType IS NULL OR r.reportType = :reportType) " +
           "ORDER BY r.createdAt DESC")
    Page<Report> findByFilters(
            @Param("status") ReportStatus status,
            @Param("reportType") ReportType reportType,
            Pageable pageable);

    // 상태별 신고 개수
    long countByStatusAndIsDeletedFalse(ReportStatus status);

    // 특정 아이템에 대한 신고 개수
    long countByReportedItemIdAndReportTypeAndIsDeletedFalse(Long reportedItemId, ReportType reportType);

    // 대기 중인 신고 개수
    @Query(value = "SELECT COUNT(*) FROM reports WHERE status = 'PENDING' AND is_deleted = false", nativeQuery = true)
    long countPendingReports();

    // 오늘 접수된 신고 개수
    @Query("SELECT COUNT(r) FROM Report r WHERE r.isDeleted = false " +
           "AND FUNCTION('DATE', r.createdAt) = CURRENT_DATE")
    long countTodayReports();

    // 특정 아이템에 대한 모든 신고 조회
    List<Report> findByReportedItemIdAndReportTypeAndIsDeletedFalse(
            Long reportedItemId, ReportType reportType);
}
