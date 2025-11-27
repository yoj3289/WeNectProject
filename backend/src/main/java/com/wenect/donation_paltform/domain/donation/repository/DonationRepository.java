package com.wenect.donation_paltform.domain.donation.repository;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
     * 상태별로 최근 기부 내역 조회 (제한된 개수)
     */
    List<Donation> findByStatusOrderByCreatedAtDesc(Donation.DonationStatus status, Pageable pageable);

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

}
