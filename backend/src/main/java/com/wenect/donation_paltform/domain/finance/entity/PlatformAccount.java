package com.wenect.donation_paltform.domain.finance.entity;

import com.wenect.donation_paltform.global.converter.AccountNumberConverter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 플랫폼 계좌 엔티티
 * 플랫폼이 후원금을 수령하는 계좌 정보 및 수수료 설정을 관리
 */
@Entity
@Table(name = "platform_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;  // 계좌 별칭 (예: "메인 수금 계좌")

    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName;  // 은행명

    @Column(name = "account_number", nullable = false, length = 255)
    @Convert(converter = AccountNumberConverter.class)
    private String accountNumber;  // 계좌번호 (AES-256-GCM 암호화)

    @Column(name = "account_holder", nullable = false, length = 50)
    private String accountHolder;  // 예금주

    @Column(name = "platform_fee_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal platformFeeRate = new BigDecimal("0.02");  // 플랫폼 수수료율 (기본 2%)

    @Column(name = "pg_fee_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal pgFeeRate = new BigDecimal("0.03");  // PG사 수수료율 (기본 3%)

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;  // 활성화 여부

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;  // 주 계좌 여부

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;  // 계좌 설명

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;  // 생성한 관리자 ID

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
     * 주 계좌로 설정
     */
    public void setAsPrimary() {
        this.isPrimary = true;
    }

    /**
     * 주 계좌 해제
     */
    public void unsetAsPrimary() {
        this.isPrimary = false;
    }

    /**
     * 계좌 비활성화
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * 계좌 활성화
     */
    public void activate() {
        this.isActive = true;
    }
}
