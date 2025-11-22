package com.wenect.donation_paltform.domain.piggybank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 저금통 엔티티
 * 정산 승인 후 생성되는 프로젝트별 저금통
 * 기관이 모금액을 인출하여 사용하는 기능 관리
 */
@Entity
@Table(name = "piggy_banks",
    uniqueConstraints = {
        @UniqueConstraint(name = "UK_piggy_banks_project", columnNames = "project_id")
    },
    indexes = {
        @Index(name = "FK_piggy_banks_project", columnList = "project_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PiggyBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "piggy_id")
    private Long piggyId;

    @Column(name = "project_id", nullable = false, unique = true)
    private Long projectId; // 프로젝트 1:1 관계

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO; // 총 보관금액 (원)

    @Column(name = "withdrawn_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal withdrawnAmount = BigDecimal.ZERO; // 인출금액 (원)

    @Column(name = "balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO; // 잔액 (원)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PiggyBankStatus status = PiggyBankStatus.ACTIVE;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated; // 최종 업데이트

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }

    /**
     * 저금통 상태
     */
    public enum PiggyBankStatus {
        ACTIVE,     // 활성 (인출 가능)
        WITHDRAWN,  // 전액 인출 완료
        LOCKED      // 잠금 (인출 불가)
    }

    /**
     * 잔액 검증
     */
    public void validateBalance() {
        if (balance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("잔액은 0 이상이어야 합니다.");
        }
    }

    /**
     * 잔액 계산 및 업데이트
     */
    public void recalculateBalance() {
        this.balance = this.totalAmount.subtract(this.withdrawnAmount);
        validateBalance();
    }

    /**
     * 입금 (저금통에 돈을 넣음)
     */
    public void deposit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("입금 금액은 0보다 커야 합니다.");
        }

        this.totalAmount = this.totalAmount.add(amount);
        recalculateBalance();
    }

    /**
     * 인출 (저금통에서 돈을 꺼냄)
     */
    public void withdraw(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("인출 금액은 0보다 커야 합니다.");
        }

        if (status != PiggyBankStatus.ACTIVE) {
            throw new IllegalStateException("활성 상태의 저금통만 인출 가능합니다.");
        }

        if (balance.compareTo(amount) < 0) {
            throw new IllegalArgumentException(
                String.format("잔액이 부족합니다. 현재 잔액: %s원, 요청 금액: %s원",
                    balance, amount)
            );
        }

        this.withdrawnAmount = this.withdrawnAmount.add(amount);
        recalculateBalance();

        // 전액 인출 시 상태 변경
        if (this.balance.compareTo(BigDecimal.ZERO) == 0) {
            this.status = PiggyBankStatus.WITHDRAWN;
        }
    }

    /**
     * 초기화 (정산 승인 시 호출)
     */
    public static PiggyBank initialize(Long projectId, BigDecimal totalAmount) {
        PiggyBank piggyBank = PiggyBank.builder()
            .projectId(projectId)
            .totalAmount(totalAmount)
            .withdrawnAmount(BigDecimal.ZERO)
            .balance(totalAmount)
            .status(PiggyBankStatus.ACTIVE)
            .build();

        return piggyBank;
    }

    /**
     * 잔액이 0인지 확인
     */
    public boolean isBalanceZero() {
        return balance.compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * 인출 가능한 상태인지 확인
     */
    public boolean canWithdraw() {
        return status == PiggyBankStatus.ACTIVE && balance.compareTo(BigDecimal.ZERO) > 0;
    }
}
