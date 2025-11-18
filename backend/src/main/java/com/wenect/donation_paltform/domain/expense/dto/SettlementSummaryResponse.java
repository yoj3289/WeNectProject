package com.wenect.donation_paltform.domain.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 결산 요약 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementSummaryResponse {

    private Long projectId;
    private String projectTitle;
    private BigDecimal totalAmount;       // 총 모금액
    private BigDecimal usedAmount;        // 사용 금액
    private BigDecimal remainingAmount;   // 잔여 금액
    private Long expenseCount;            // 지출 건수
    private Integer donorCount;           // 기부자 수
    private LocalDate completedDate;      // 프로젝트 종료일
    private String settlementStatus;      // 결산 상태 (pending, in_progress, completed)
    private String remainingPlan;         // 잔여금 처리 계획
}
