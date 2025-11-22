package com.wenect.donation_paltform.domain.piggybank.dto;

import com.wenect.donation_paltform.domain.expense.dto.ExpenseResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 저금통 상세 정보 DTO (지출 내역 포함)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiggyBankDetailDto {

    private Long piggyId;
    private Long projectId;
    private String projectTitle;
    private BigDecimal totalAmount;
    private BigDecimal withdrawnAmount;
    private BigDecimal balance;
    private String status;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;

    // 지출 내역 (Expense 엔티티 재활용)
    private List<ExpenseResponse> withdrawalHistory;

    // 카테고리별 통계
    private List<CategoryStatDto> categoryStats;
}
