package com.wenect.donation_paltform.domain.expense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "expense_id")
    private Long expenseId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "receipt_url", nullable = false, length = 500)
    private String receiptUrl;

    @Column(name = "receipt_thumbnail_url", length = 500)
    private String receiptThumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ExpenseStatus {
        PENDING,   // 승인 대기
        APPROVED,  // 승인됨
        REJECTED   // 반려됨
    }

    /**
     * 지출 승인
     */
    public void approve() {
        this.status = ExpenseStatus.APPROVED;
        this.rejectionReason = null;
    }

    /**
     * 지출 반려
     */
    public void reject(String reason) {
        this.status = ExpenseStatus.REJECTED;
        this.rejectionReason = reason;
    }
}
