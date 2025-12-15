package com.wenect.donation_paltform.domain.donation.repository;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    /**
     * 주문 ID로 기부 내역 조회
     */
    Optional<Donation> findByOrderId(String orderId);

    /**
     * 프로젝트 ID로 기부 내역 목록 조회
     */
    List<Donation> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    /**
     * 사용자 ID로 기부 내역 목록 조회
     */
    List<Donation> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 프로젝트 ID와 상태로 기부 내역 목록 조회
     */
    List<Donation> findByProjectIdAndStatus(Long projectId, Donation.DonationStatus status);

    /**
     * 상태별로 최근 기부 내역 조회 (제한된 개수, List 반환)
     */
    List<Donation> findByStatusOrderByCreatedAtDesc(Donation.DonationStatus status, Pageable pageable);

    /**
     * 상태별 기부 내역 조회 (페이지네이션, Page 반환)
     */
    Page<Donation> findByStatus(Donation.DonationStatus status, Pageable pageable);

    /**
     * 상태 및 기간으로 최근 기부 내역 조회 (일주일 기준)
     */
    List<Donation> findByStatusAndDonatedAtAfterOrderByDonatedAtDesc(
            Donation.DonationStatus status, LocalDateTime after, Pageable pageable);

    /**
     * 특정 프로젝트에 대해 해당 사용자의 완료된 기부가 있는지 확인
     * (기부자 수 중복 카운트 방지용)
     */
    boolean existsByProjectIdAndUserIdAndStatus(Long projectId, Long userId, Donation.DonationStatus status);

    // ==================== 페이지네이션 지원 ====================

    /**
     * 사용자 ID로 기부 내역 조회 (페이지네이션)
     */
    Page<Donation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * 사용자 ID + 연도 필터로 기부 내역 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.userId = :userId AND YEAR(d.createdAt) = :year ORDER BY d.createdAt DESC")
    Page<Donation> findByUserIdAndYear(@Param("userId") Long userId, @Param("year") int year, Pageable pageable);

    /**
     * 사용자 ID + 상태 필터로 기부 내역 조회 (페이지네이션)
     */
    Page<Donation> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Donation.DonationStatus status, Pageable pageable);

    /**
     * 사용자 ID + 연도 + 상태 필터로 기부 내역 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.userId = :userId AND YEAR(d.createdAt) = :year AND d.status = :status ORDER BY d.createdAt DESC")
    Page<Donation> findByUserIdAndYearAndStatus(@Param("userId") Long userId, @Param("year") int year, @Param("status") Donation.DonationStatus status, Pageable pageable);

    // ==================== Featured Messages (홈페이지 노출용) ====================

    /**
     * 홈페이지에 노출할 Featured 기부 메시지 조회
     * - isFeatured=true인 것만
     * - 메시지가 있는 것만
     */
    @Query("SELECT d FROM Donation d WHERE d.isFeatured = true AND d.message IS NOT NULL AND d.message <> '' ORDER BY d.createdAt DESC")
    List<Donation> findFeaturedDonations(Pageable pageable);

    /**
     * Featured 기부 개수 조회
     */
    @Query("SELECT COUNT(d) FROM Donation d WHERE d.isFeatured = true")
    long countFeaturedDonations();

    // ==================== 관리자용 전체 기부 조회 ====================

    /**
     * 전체 기부 내역 조회 (페이지네이션, 최신순)
     */
    Page<Donation> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 메시지가 있는 기부만 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.message IS NOT NULL AND d.message <> '' ORDER BY d.createdAt DESC")
    Page<Donation> findAllWithMessage(Pageable pageable);

    /**
     * 메시지가 없는 기부만 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.message IS NULL OR d.message = '' ORDER BY d.createdAt DESC")
    Page<Donation> findAllWithoutMessage(Pageable pageable);

    /**
     * 메시지가 있고 특정 상태인 기부 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.message IS NOT NULL AND d.message <> '' AND d.status = :status ORDER BY d.createdAt DESC")
    Page<Donation> findWithMessageAndStatus(@Param("status") Donation.DonationStatus status, Pageable pageable);

    /**
     * 메시지가 없고 특정 상태인 기부 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE (d.message IS NULL OR d.message = '') AND d.status = :status ORDER BY d.createdAt DESC")
    Page<Donation> findWithoutMessageAndStatus(@Param("status") Donation.DonationStatus status, Pageable pageable);

    /**
     * Featured 상태별 기부 조회 (페이지네이션)
     */
    Page<Donation> findByIsFeaturedAndStatusOrderByCreatedAtDesc(boolean isFeatured, Donation.DonationStatus status, Pageable pageable);

    /**
     * 기간 내 기부 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.createdAt >= :startDate ORDER BY d.createdAt DESC")
    Page<Donation> findByCreatedAtAfter(@Param("startDate") LocalDateTime startDate, Pageable pageable);

    /**
     * 기간 내 + 상태별 기부 조회 (페이지네이션)
     */
    @Query("SELECT d FROM Donation d WHERE d.createdAt >= :startDate AND d.status = :status ORDER BY d.createdAt DESC")
    Page<Donation> findByCreatedAtAfterAndStatus(@Param("startDate") LocalDateTime startDate, @Param("status") Donation.DonationStatus status, Pageable pageable);

    // ==================== 스케줄러용 (오래된 PENDING 정리) ====================

    /**
     * 오래된 PENDING 상태 기부 삭제 (벌크 삭제)
     * - PENDING 상태이고 생성일이 지정 시간 이전인 기부
     */
    @Modifying
    @Query(value = "DELETE FROM donations WHERE status = 'PENDING' AND created_at < :cutoffDate", nativeQuery = true)
    int deleteOldPendingDonations(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ==================== 알림용 (프로젝트별 기부자 조회) ====================

    /**
     * 프로젝트에 기부한 사용자 ID 목록 조회 (중복 제거)
     * - COMPLETED 상태인 기부만 대상
     */
    @Query(value = "SELECT DISTINCT user_id FROM donations WHERE project_id = :projectId AND status = 'COMPLETED' AND user_id IS NOT NULL", nativeQuery = true)
    List<Long> findDistinctUserIdsByProjectId(@Param("projectId") Long projectId);

    // ==================== 성능 최적화: 집계 쿼리 ====================

    /**
     * 기간 내 완료된 기부 총액 조회
     */
    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'COMPLETED' AND donated_at BETWEEN :start AND :end", nativeQuery = true)
    java.math.BigDecimal sumAmountByStatusAndDonatedAtBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 기간 내 완료된 기부 건수 조회
     */
    @Query(value = "SELECT COUNT(*) FROM donations WHERE status = 'COMPLETED' AND donated_at BETWEEN :start AND :end", nativeQuery = true)
    Long countByStatusAndDonatedAtBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 주간 기부 통계 조회 (집계)
     */
    @Query(value = "SELECT DATE_FORMAT(donated_at, '%Y-%m-%d') as dateStr, " +
            "COALESCE(SUM(amount), 0) as totalAmount, COUNT(*) as totalCount " +
            "FROM donations " +
            "WHERE status = 'COMPLETED' AND donated_at BETWEEN :start AND :end " +
            "GROUP BY DATE_FORMAT(donated_at, '%Y-%m-%d') " +
            "ORDER BY dateStr", nativeQuery = true)
    List<Object[]> findDonationStatsByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 월별 기부 통계 조회 (집계)
     */
    @Query(value = "SELECT DATE_FORMAT(donated_at, '%Y-%m') as monthStr, " +
            "COALESCE(SUM(amount), 0) as totalAmount, COUNT(*) as totalCount " +
            "FROM donations " +
            "WHERE status = 'COMPLETED' AND donated_at BETWEEN :start AND :end " +
            "GROUP BY DATE_FORMAT(donated_at, '%Y-%m') " +
            "ORDER BY monthStr", nativeQuery = true)
    List<Object[]> findMonthlyDonationStats(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ==================== Finance 도메인 연동용 ====================

    /**
     * 결제 수단, 상태, 기간으로 기부 내역 조회 (PG 정산용)
     */
    List<Donation> findByPaymentMethodAndStatusAndDonatedAtBetween(
            Donation.PaymentMethod paymentMethod,
            Donation.DonationStatus status,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime);

}
