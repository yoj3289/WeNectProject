package com.wenect.donation_paltform.domain.settlement.repository;

import com.wenect.donation_paltform.domain.settlement.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 정산 Repository
 */
@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    /**
     * 프로젝트 ID로 정산 목록 조회
     */
    List<Settlement> findByProjectIdOrderByRequestedAtDesc(Long projectId);

    /**
     * 프로젝트 ID로 최신 정산 조회
     */
    Optional<Settlement> findFirstByProjectIdOrderByRequestedAtDesc(Long projectId);

    /**
     * 상태별 정산 목록 조회 (최신순)
     */
    List<Settlement> findByStatusOrderByRequestedAtDesc(Settlement.SettlementStatus status);

    /**
     * 상태별 정산 개수 조회
     */
    Long countByStatus(Settlement.SettlementStatus status);

    /**
     * 프로젝트 ID와 상태로 정산 존재 여부 확인
     */
    boolean existsByProjectIdAndStatus(Long projectId, Settlement.SettlementStatus status);

    /**
     * 프로젝트 ID로 승인된 정산 조회
     */
    @Query("SELECT s FROM Settlement s WHERE s.projectId = :projectId AND s.status IN ('APPROVED', 'COMPLETED')")
    Optional<Settlement> findApprovedSettlementByProjectId(@Param("projectId") Long projectId);
}
