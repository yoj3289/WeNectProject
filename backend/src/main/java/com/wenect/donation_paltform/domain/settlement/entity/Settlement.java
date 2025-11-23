package com.wenect.donation_paltform.domain.settlement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 정산 엔티티
 * 기관이 프로젝트 모금 완료 후 정산을 요청하고 관리자가 승인/반려하는 정보를 관리
 */
@Entity
@Table(name = "settlements", indexes = {
    @Index(name = "IDX_settlements_status", columnList = "status, requested_at DESC"),
    @Index(name = "IDX_settlements_project_date", columnList = "project_id, requested_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "settlement_id")
    private Long settlementId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "piggy_id")
    private Long piggyId; // 정산 승인 후 생성된 저금통 ID

    @Column(name = "settlement_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal settlementAmount; // 정산 신청 금액

    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName; // 입금 은행명

    @Column(name = "account_number", nullable = false, length = 255)
    // @Convert(converter = com.wenect.donation_paltform.global.converter.AccountNumberConverter.class) // TODO: 나중에 암호화 적용
    private String accountNumber; // 입금 계좌번호 (현재 평문 저장)

    @Column(name = "account_holder", nullable = false, length = 50)
    private String accountHolder; // 예금주명

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SettlementStatus status = SettlementStatus.PENDING;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt; // 정산 요청일시

    @Column(name = "approved_at")
    private LocalDateTime approvedAt; // 승인일시

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // 출금 완료일시

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason; // 반려 사유

    @Column(name = "admin_memo", columnDefinition = "TEXT")
    private String adminMemo; // 관리자 메모

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 정산 서류 (1:N)
    @OneToMany(mappedBy = "settlement", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SettlementDocument> documents = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 정산 상태
     */
    public enum SettlementStatus {
        PENDING,    // 정산 요청 대기 (관리자 검토 대기)
        APPROVED,   // 정산 승인됨 (저금통 생성됨)
        COMPLETED,  // 정산 완료 (출금 완료)
        REJECTED    // 정산 반려 (재요청 가능)
    }

    /**
     * 정산 승인
     */
    public void approve(Long piggyId, String adminMemo) {
        this.status = SettlementStatus.APPROVED;
        this.piggyId = piggyId;
        this.approvedAt = LocalDateTime.now();
        this.adminMemo = adminMemo;
    }

    /**
     * 정산 반려
     */
    public void reject(String rejectionReason) {
        this.status = SettlementStatus.REJECTED;
        this.rejectionReason = rejectionReason;
    }

    /**
     * 정산 완료
     */
    public void complete() {
        this.status = SettlementStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    /**
     * 서류 추가
     */
    public void addDocument(SettlementDocument document) {
        documents.add(document);
        document.setSettlement(this);
    }
}
