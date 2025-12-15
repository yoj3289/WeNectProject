package com.wenect.donation_paltform.domain.finance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 플랫폼 원장 엔티티
 * 플랫폼 계좌의 모든 입출금 내역을 기록하는 가계부
 * 해시 체인으로 무결성 보장
 */
@Entity
@Table(name = "platform_ledger", indexes = {
    @Index(name = "IDX_ledger_created", columnList = "created_at DESC"),
    @Index(name = "IDX_ledger_type", columnList = "ledger_type, created_at DESC"),
    @Index(name = "IDX_ledger_category", columnList = "category, created_at DESC"),
    @Index(name = "IDX_ledger_reference", columnList = "reference_type, reference_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ledger_id")
    private Long ledgerId;

    @Column(name = "platform_account_id", nullable = false)
    private Long platformAccountId;  // 플랫폼 계좌 ID

    @Enumerated(EnumType.STRING)
    @Column(name = "ledger_type", nullable = false, length = 20)
    private LedgerType ledgerType;  // 입금/출금

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LedgerCategory category;  // 거래 분류

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;  // 거래 금액 (양수)

    @Column(name = "balance_before", nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceBefore;  // 거래 전 잔액

    @Column(name = "balance_after", nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceAfter;  // 거래 후 잔액

    @Column(name = "reference_type", length = 50)
    private String referenceType;  // 관련 엔티티 타입 (PgSettlement, Settlement, Donation 등)

    @Column(name = "reference_id")
    private Long referenceId;  // 관련 엔티티 ID

    @Column(name = "project_id")
    private Long projectId;  // 관련 프로젝트 ID (있는 경우)

    @Column(name = "organization_id")
    private Long organizationId;  // 관련 기관 ID (있는 경우)

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;  // 거래 설명

    @Column(name = "performed_by")
    private Long performedBy;  // 수행자 ID (관리자 또는 시스템)

    @Column(name = "performed_by_type", length = 20)
    @Builder.Default
    private String performedByType = "SYSTEM";  // SYSTEM, ADMIN

    // 무결성 검증용 해시 체인
    @Column(name = "transaction_hash", nullable = false, length = 64)
    private String transactionHash;  // 현재 거래 해시 (SHA-256)

    @Column(name = "previous_hash", length = 64)
    private String previousHash;  // 이전 거래 해시

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * 원장 유형 (입금/출금)
     */
    public enum LedgerType {
        DEPOSIT,     // 입금
        WITHDRAWAL   // 출금
    }

    /**
     * 거래 분류
     */
    public enum LedgerCategory {
        PG_SETTLEMENT,      // PG사 정산 입금
        ORG_SETTLEMENT,     // 기관 정산 출금
        PLATFORM_FEE,       // 플랫폼 수수료 수익
        REFUND,             // 환불 출금
        REFUND_CANCEL,      // 환불 취소 입금
        ADJUSTMENT_PLUS,    // 조정 입금 (오류 수정)
        ADJUSTMENT_MINUS,   // 조정 출금 (오류 수정)
        INITIAL_BALANCE     // 초기 잔액 설정
    }

    /**
     * 입금 처리
     */
    public static PlatformLedger createDeposit(
            Long platformAccountId,
            LedgerCategory category,
            BigDecimal amount,
            BigDecimal currentBalance,
            String referenceType,
            Long referenceId,
            String description,
            String previousHash
    ) {
        BigDecimal newBalance = currentBalance.add(amount);

        PlatformLedger ledger = PlatformLedger.builder()
                .platformAccountId(platformAccountId)
                .ledgerType(LedgerType.DEPOSIT)
                .category(category)
                .amount(amount)
                .balanceBefore(currentBalance)
                .balanceAfter(newBalance)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .description(description)
                .previousHash(previousHash)
                .build();

        return ledger;
    }

    /**
     * 출금 처리
     */
    public static PlatformLedger createWithdrawal(
            Long platformAccountId,
            LedgerCategory category,
            BigDecimal amount,
            BigDecimal currentBalance,
            String referenceType,
            Long referenceId,
            String description,
            String previousHash
    ) {
        BigDecimal newBalance = currentBalance.subtract(amount);

        PlatformLedger ledger = PlatformLedger.builder()
                .platformAccountId(platformAccountId)
                .ledgerType(LedgerType.WITHDRAWAL)
                .category(category)
                .amount(amount)
                .balanceBefore(currentBalance)
                .balanceAfter(newBalance)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .description(description)
                .previousHash(previousHash)
                .build();

        return ledger;
    }
}
