package com.wenect.donation_paltform.domain.expense.dto;

import com.wenect.donation_paltform.domain.expense.entity.Expense;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 지출 내역 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {

    private Long expenseId;
    private Long projectId;
    private LocalDate expenseDate;
    private String category;
    private String description;
    private BigDecimal amount;
    private String receiptUrl;
    private String receiptThumbnailUrl;
    private String status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Entity를 DTO로 변환
     */
    public static ExpenseResponse from(Expense expense) {
        return ExpenseResponse.builder()
                .expenseId(expense.getExpenseId())
                .projectId(expense.getProjectId())
                .expenseDate(expense.getExpenseDate())
                .category(expense.getCategory())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .receiptUrl(expense.getReceiptUrl())
                .receiptThumbnailUrl(expense.getReceiptThumbnailUrl())
                .status(expense.getStatus().name().toLowerCase())
                .rejectionReason(expense.getRejectionReason())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
