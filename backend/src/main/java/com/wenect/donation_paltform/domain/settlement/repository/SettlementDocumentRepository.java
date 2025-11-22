package com.wenect.donation_paltform.domain.settlement.repository;

import com.wenect.donation_paltform.domain.settlement.entity.SettlementDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 정산 서류 Repository
 */
@Repository
public interface SettlementDocumentRepository extends JpaRepository<SettlementDocument, Long> {

    /**
     * 정산 ID로 서류 목록 조회
     */
    List<SettlementDocument> findBySettlement_SettlementId(Long settlementId);

    /**
     * 정산 ID로 서류 개수 조회
     */
    Long countBySettlement_SettlementId(Long settlementId);
}
