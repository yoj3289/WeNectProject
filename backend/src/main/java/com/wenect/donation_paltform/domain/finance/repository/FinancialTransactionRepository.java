package com.wenect.donation_paltform.domain.finance.repository;

import com.wenect.donation_paltform.domain.finance.entity.FinancialTransaction;
import com.wenect.donation_paltform.domain.finance.entity.FinancialTransaction.TransactionStatus;
import com.wenect.donation_paltform.domain.finance.entity.FinancialTransaction.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {

    /**
     * 거래 코드로 조회
     */
    Optional<FinancialTransaction> findByTransactionCode(String transactionCode);

    /**
     * 기부 ID로 거래 조회
     */
    List<FinancialTransaction> findByDonationIdOrderByCreatedAtDesc(Long donationId);

    /**
     * 프로젝트별 거래 조회
     */
    Page<FinancialTransaction> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);

    /**
     * 기관별 거래 조회
     */
    Page<FinancialTransaction> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId, Pageable pageable);

    /**
     * 정산 ID로 거래 조회
     */
    List<FinancialTransaction> findBySettlementId(Long settlementId);

    /**
     * 지출 ID로 거래 조회
     */
    Optional<FinancialTransaction> findByExpenseId(Long expenseId);

    /**
     * PG 정산 ID로 거래 조회
     */
    List<FinancialTransaction> findByPgSettlementId(Long pgSettlementId);

    /**
     * 거래 유형별 조회
     */
    Page<FinancialTransaction> findByTransactionTypeOrderByCreatedAtDesc(
            TransactionType transactionType, Pageable pageable);

    /**
     * 상태별 조회
     */
    Page<FinancialTransaction> findByStatusOrderByCreatedAtDesc(
            TransactionStatus status, Pageable pageable);

    /**
     * 특정 기간 거래 조회
     */
    List<FinancialTransaction> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDateTime, LocalDateTime endDateTime);

    /**
     * 특정 기간, 유형별 금액 합계
     */
    @Query("SELECT COALESCE(SUM(ft.amount), 0) FROM FinancialTransaction ft " +
           "WHERE ft.transactionType = :type " +
           "AND ft.status = 'COMPLETED' " +
           "AND ft.createdAt BETWEEN :startDateTime AND :endDateTime")
    BigDecimal sumAmountByTypeAndDateRange(
            @Param("type") TransactionType type,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * 유형별 총 금액
     */
    @Query("SELECT COALESCE(SUM(ft.amount), 0) FROM FinancialTransaction ft " +
           "WHERE ft.transactionType = :type AND ft.status = 'COMPLETED'")
    BigDecimal sumAmountByType(@Param("type") TransactionType type);

    /**
     * 유형별 총 수수료
     */
    @Query("SELECT COALESCE(SUM(ft.feeAmount), 0) FROM FinancialTransaction ft " +
           "WHERE ft.transactionType = :type AND ft.status = 'COMPLETED'")
    BigDecimal sumFeeAmountByType(@Param("type") TransactionType type);

    /**
     * 특정 기간 거래 건수
     */
    @Query("SELECT COUNT(ft) FROM FinancialTransaction ft " +
           "WHERE ft.transactionType = :type " +
           "AND ft.status = 'COMPLETED' " +
           "AND ft.createdAt BETWEEN :startDateTime AND :endDateTime")
    Long countByTypeAndDateRange(
            @Param("type") TransactionType type,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * 수행자별 거래 조회 (감사용)
     */
    Page<FinancialTransaction> findByPerformedByOrderByCreatedAtDesc(Long performedBy, Pageable pageable);
}
