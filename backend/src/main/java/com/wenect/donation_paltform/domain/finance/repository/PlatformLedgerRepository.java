package com.wenect.donation_paltform.domain.finance.repository;

import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerCategory;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerType;
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
public interface PlatformLedgerRepository extends JpaRepository<PlatformLedger, Long> {

    /**
     * 특정 계좌의 최신 원장 기록 조회 (현재 잔액 확인용)
     */
    Optional<PlatformLedger> findTopByPlatformAccountIdOrderByCreatedAtDesc(Long platformAccountId);

    /**
     * 특정 계좌의 원장 기록 페이징 조회
     */
    Page<PlatformLedger> findByPlatformAccountIdOrderByCreatedAtDesc(Long platformAccountId, Pageable pageable);

    /**
     * 유형별 원장 기록 조회
     */
    Page<PlatformLedger> findByLedgerTypeOrderByCreatedAtDesc(LedgerType ledgerType, Pageable pageable);

    /**
     * 카테고리별 원장 기록 조회
     */
    Page<PlatformLedger> findByCategoryOrderByCreatedAtDesc(LedgerCategory category, Pageable pageable);

    /**
     * 특정 기간 원장 기록 조회
     */
    List<PlatformLedger> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDateTime, LocalDateTime endDateTime);

    /**
     * 특정 참조 엔티티의 원장 기록 조회
     */
    List<PlatformLedger> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

    /**
     * 특정 기간 입금 총액
     */
    @Query("SELECT COALESCE(SUM(pl.amount), 0) FROM PlatformLedger pl " +
           "WHERE pl.ledgerType = 'DEPOSIT' " +
           "AND pl.createdAt BETWEEN :startDateTime AND :endDateTime")
    BigDecimal sumDepositsByDateRange(
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * 특정 기간 출금 총액
     */
    @Query("SELECT COALESCE(SUM(pl.amount), 0) FROM PlatformLedger pl " +
           "WHERE pl.ledgerType = 'WITHDRAWAL' " +
           "AND pl.createdAt BETWEEN :startDateTime AND :endDateTime")
    BigDecimal sumWithdrawalsByDateRange(
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * 카테고리별 금액 합계
     */
    @Query("SELECT COALESCE(SUM(pl.amount), 0) FROM PlatformLedger pl " +
           "WHERE pl.category = :category")
    BigDecimal sumAmountByCategory(@Param("category") LedgerCategory category);

    /**
     * 프로젝트별 원장 기록 조회
     */
    List<PlatformLedger> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    /**
     * 기관별 원장 기록 조회
     */
    List<PlatformLedger> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    /**
     * 이전 해시 조회 (무결성 검증용)
     */
    @Query("SELECT pl.transactionHash FROM PlatformLedger pl " +
           "WHERE pl.platformAccountId = :accountId " +
           "ORDER BY pl.createdAt DESC LIMIT 1")
    Optional<String> findLatestHashByAccountId(@Param("accountId") Long accountId);

    /**
     * 해시 체인 검증용 - 순서대로 조회
     */
    List<PlatformLedger> findByPlatformAccountIdOrderByCreatedAtAsc(Long platformAccountId);
}
