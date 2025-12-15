package com.wenect.donation_paltform.domain.finance.repository;

import com.wenect.donation_paltform.domain.finance.entity.PgSettlement;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement.PgProvider;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement.PgSettlementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PgSettlementRepository extends JpaRepository<PgSettlement, Long> {

    /**
     * 정산일과 PG사로 조회
     */
    Optional<PgSettlement> findBySettlementDateAndPgProvider(LocalDate settlementDate, PgProvider pgProvider);

    /**
     * 특정 기간의 정산 내역 조회
     */
    List<PgSettlement> findBySettlementDateBetweenOrderBySettlementDateDesc(
            LocalDate startDate, LocalDate endDate);

    /**
     * 상태별 정산 내역 조회
     */
    Page<PgSettlement> findByStatusOrderBySettlementDateDesc(PgSettlementStatus status, Pageable pageable);

    /**
     * 대사 미완료 정산 조회
     */
    List<PgSettlement> findByIsReconciledFalseOrderBySettlementDateAsc();

    /**
     * 불일치 정산 조회
     */
    List<PgSettlement> findByStatusOrderBySettlementDateDesc(PgSettlementStatus status);

    /**
     * 특정 기간 총 정산액 합계
     */
    @Query("SELECT COALESCE(SUM(ps.netSettlementAmount), 0) FROM PgSettlement ps " +
           "WHERE ps.settlementDate BETWEEN :startDate AND :endDate " +
           "AND ps.status IN ('COMPLETED', 'ADJUSTED')")
    BigDecimal sumNetSettlementAmountByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * PG사별 총 정산액
     */
    @Query("SELECT COALESCE(SUM(ps.netSettlementAmount), 0) FROM PgSettlement ps " +
           "WHERE ps.pgProvider = :provider " +
           "AND ps.status IN ('COMPLETED', 'ADJUSTED')")
    BigDecimal sumNetSettlementAmountByProvider(@Param("provider") PgProvider provider);

    /**
     * 특정 기간에 해당하는 정산이 이미 존재하는지 확인
     */
    boolean existsByPgProviderAndPeriodStartAndPeriodEnd(
            PgProvider pgProvider, LocalDate periodStart, LocalDate periodEnd);
}
