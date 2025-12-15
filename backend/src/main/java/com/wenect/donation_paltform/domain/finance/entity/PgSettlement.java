package com.wenect.donation_paltform.domain.finance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PG사 정산 엔티티
 * PG사(카카오페이, 토스페이)가 플랫폼에 정산하는 내역을 관리
 */
@Entity
@Table(name = "pg_settlements", indexes = {
    @Index(name = "IDX_pg_settlements_date", columnList = "settlement_date DESC"),
    @Index(name = "IDX_pg_settlements_provider", columnList = "pg_provider, settlement_date DESC"),
    @Index(name = "IDX_pg_settlements_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PgSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pg_settlement_id")
    private Long pgSettlementId;

    @Enumerated(EnumType.STRING)
    @Column(name = "pg_provider", nullable = false, length = 20)
    private PgProvider pgProvider;  // PG사

    @Column(name = "settlement_date", nullable = false)
    private LocalDate settlementDate;  // 정산일

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;  // 정산 기간 시작일

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;  // 정산 기간 종료일

    @Column(name = "total_transaction_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalTransactionAmount;  // 총 거래액

    @Column(name = "transaction_count", nullable = false)
    private Integer transactionCount;  // 거래 건수

    @Column(name = "pg_fee_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal pgFeeAmount;  // PG사 수수료

    @Column(name = "net_settlement_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSettlementAmount;  // 실수령액 (총 거래액 - PG 수수료)

    @Column(name = "calculated_amount", precision = 15, scale = 2)
    private BigDecimal calculatedAmount;  // 시스템 계산 금액 (대사 검증용)

    @Column(name = "is_reconciled", nullable = false)
    @Builder.Default
    private Boolean isReconciled = false;  // 대사 완료 여부

    @Column(name = "reconciliation_note", columnDefinition = "TEXT")
    private String reconciliationNote;  // 대사 메모

    @Column(name = "difference_amount", precision = 15, scale = 2)
    private BigDecimal differenceAmount;  // 차이 금액 (불일치 시)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PgSettlementStatus status = PgSettlementStatus.PENDING;

    @Column(name = "platform_account_id")
    private Long platformAccountId;  // 입금된 플랫폼 계좌 ID

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reconciled_at")
    private LocalDateTime reconciledAt;  // 대사 완료 시간

    @Column(name = "reconciled_by")
    private Long reconciledBy;  // 대사 처리자 ID

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * PG사 종류
     */
    public enum PgProvider {
        KAKAO_PAY,  // 카카오페이
        TOSS_PAY    // 토스페이
    }

    /**
     * PG 정산 상태
     */
    public enum PgSettlementStatus {
        PENDING,     // 정산 예정
        COMPLETED,   // 정산 완료 (대사 일치)
        MISMATCH,    // 금액 불일치 (관리자 확인 필요)
        ADJUSTED     // 조정 완료 (불일치 해결됨)
    }

    /**
     * 대사 완료 처리
     */
    public void completeReconciliation(BigDecimal calculatedAmount, Long reconciledBy) {
        this.calculatedAmount = calculatedAmount;
        this.differenceAmount = this.netSettlementAmount.subtract(calculatedAmount);
        this.isReconciled = true;
        this.reconciledAt = LocalDateTime.now();
        this.reconciledBy = reconciledBy;

        // 차이가 0이면 COMPLETED, 아니면 MISMATCH
        if (this.differenceAmount.compareTo(BigDecimal.ZERO) == 0) {
            this.status = PgSettlementStatus.COMPLETED;
        } else {
            this.status = PgSettlementStatus.MISMATCH;
        }
    }

    /**
     * 조정 완료 처리
     */
    public void adjustAndComplete(String note) {
        this.status = PgSettlementStatus.ADJUSTED;
        this.reconciliationNote = note;
    }
}
