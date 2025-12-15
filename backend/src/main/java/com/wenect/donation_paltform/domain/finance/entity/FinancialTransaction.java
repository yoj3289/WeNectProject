package com.wenect.donation_paltform.domain.finance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 금융 거래 엔티티
 * 시스템 전체의 모든 돈의 이동을 기록 (누가 → 누구에게)
 */
@Entity
@Table(name = "financial_transactions", indexes = {
    @Index(name = "IDX_fin_tx_code", columnList = "transaction_code", unique = true),
    @Index(name = "IDX_fin_tx_type", columnList = "transaction_type, created_at DESC"),
    @Index(name = "IDX_fin_tx_status", columnList = "status, created_at DESC"),
    @Index(name = "IDX_fin_tx_donation", columnList = "donation_id"),
    @Index(name = "IDX_fin_tx_project", columnList = "project_id"),
    @Index(name = "IDX_fin_tx_org", columnList = "organization_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 50)
    private String transactionCode;  // 고유 거래 코드 (예: TXN-20250115-00001)

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;  // 거래 유형

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;  // 거래 금액

    @Column(name = "fee_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal feeAmount = BigDecimal.ZERO;  // 수수료

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;  // 실금액 (amount - feeAmount)

    // 출발지 계좌 정보
    @Enumerated(EnumType.STRING)
    @Column(name = "from_account_type", nullable = false, length = 20)
    private AccountType fromAccountType;  // 출금 계좌 유형

    @Column(name = "from_account_id")
    private Long fromAccountId;  // 출금 계좌/엔티티 ID

    // 목적지 계좌 정보
    @Enumerated(EnumType.STRING)
    @Column(name = "to_account_type", nullable = false, length = 20)
    private AccountType toAccountType;  // 입금 계좌 유형

    @Column(name = "to_account_id")
    private Long toAccountId;  // 입금 계좌/엔티티 ID

    // 연관 정보
    @Column(name = "donation_id")
    private Long donationId;  // 관련 기부 ID

    @Column(name = "project_id")
    private Long projectId;  // 관련 프로젝트 ID

    @Column(name = "organization_id")
    private Long organizationId;  // 관련 기관 ID

    @Column(name = "settlement_id")
    private Long settlementId;  // 관련 정산 ID

    @Column(name = "expense_id")
    private Long expenseId;  // 관련 지출 ID

    @Column(name = "pg_settlement_id")
    private Long pgSettlementId;  // 관련 PG 정산 ID

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String description;  // 거래 설명

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;  // 실패 사유

    // 추적 정보
    @Column(name = "performed_by")
    private Long performedBy;  // 수행자 ID

    @Column(name = "performed_by_type", length = 20)
    @Builder.Default
    private String performedByType = "SYSTEM";  // SYSTEM, ADMIN, USER

    @Column(name = "ip_address", length = 45)
    private String ipAddress;  // 요청 IP (보안)

    @Column(name = "user_agent", length = 500)
    private String userAgent;  // 요청 User-Agent

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (netAmount == null) {
            netAmount = amount.subtract(feeAmount != null ? feeAmount : BigDecimal.ZERO);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 거래 유형
     */
    public enum TransactionType {
        DONATION,           // 기부 결제 (기부자 → PG사)
        PG_SETTLEMENT,      // PG사 정산 (PG사 → 플랫폼)
        ORG_SETTLEMENT,     // 기관 정산 (플랫폼 → 저금통)
        EXPENSE,            // 지출 승인 (저금통 → 기관)
        REFUND,             // 환불 (플랫폼 → 기부자)
        FEE_COLLECTION,     // 수수료 징수
        ADJUSTMENT          // 조정
    }

    /**
     * 계좌 유형
     */
    public enum AccountType {
        DONOR,              // 기부자
        PG_PROVIDER,        // PG사 (카카오페이, 토스페이)
        PLATFORM,           // 플랫폼 계좌
        PIGGYBANK,          // 저금통
        ORGANIZATION        // 기관
    }

    /**
     * 거래 상태
     */
    public enum TransactionStatus {
        PENDING,        // 대기중
        PROCESSING,     // 처리중
        COMPLETED,      // 완료
        FAILED,         // 실패
        CANCELLED,      // 취소됨
        REVERSED        // 되돌림 (환불 등)
    }

    /**
     * 거래 완료 처리
     */
    public void complete() {
        this.status = TransactionStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    /**
     * 거래 실패 처리
     */
    public void fail(String reason) {
        this.status = TransactionStatus.FAILED;
        this.failureReason = reason;
    }

    /**
     * 거래 취소 처리
     */
    public void cancel(String reason) {
        this.status = TransactionStatus.CANCELLED;
        this.failureReason = reason;
    }

    /**
     * 거래 코드 생성
     */
    public static String generateTransactionCode(TransactionType type) {
        String prefix = switch (type) {
            case DONATION -> "DON";
            case PG_SETTLEMENT -> "PGS";
            case ORG_SETTLEMENT -> "ORS";
            case EXPENSE -> "EXP";
            case REFUND -> "REF";
            case FEE_COLLECTION -> "FEE";
            case ADJUSTMENT -> "ADJ";
        };
        return String.format("%s-%tY%<tm%<td-%06d", prefix, LocalDateTime.now(), System.nanoTime() % 1000000);
    }
}
