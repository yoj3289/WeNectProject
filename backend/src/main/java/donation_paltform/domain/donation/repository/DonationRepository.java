package com.wenect.donation_paltform.domain.donation.repository;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
