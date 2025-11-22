package com.wenect.donation_paltform.domain.piggybank.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 카테고리별 지출 통계 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryStatDto {

    private String category;       // 카테고리명 (급식비, 교재비 등)
    private BigDecimal amount;     // 해당 카테고리 총 지출액
    private Long count;            // 지출 건수
    private Double percentage;     // 전체 대비 비율 (%)
}
