package com.wenect.donation_paltform.domain.piggybank.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 저금통 인출 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequestDto {

    private BigDecimal amount;        // 인출 금액
    private String category;          // 지출 카테고리 (급식비, 교재비 등)
    private String description;       // 상세 설명
    private LocalDate expenseDate;    // 지출 일자
    // receiptFile은 MultipartFile로 컨트롤러에서 별도 처리
}
