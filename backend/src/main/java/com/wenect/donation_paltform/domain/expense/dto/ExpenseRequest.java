package com.wenect.donation_paltform.domain.expense.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 지출 내역 등록/수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequest {

    @NotNull(message = "프로젝트 ID는 필수입니다")
    private Long projectId;

    @NotNull(message = "지출 날짜는 필수입니다")
    private LocalDate expenseDate;

    @NotBlank(message = "카테고리는 필수입니다")
    @Size(max = 50, message = "카테고리는 50자를 초과할 수 없습니다")
    private String category;

    @NotBlank(message = "상세 설명은 필수입니다")
    private String description;

    @NotNull(message = "금액은 필수입니다")
    @DecimalMin(value = "0.0", inclusive = false, message = "금액은 0보다 커야 합니다")
    private BigDecimal amount;

    @NotBlank(message = "영수증 URL은 필수입니다")
    private String receiptUrl;

    private String receiptThumbnailUrl;
}
