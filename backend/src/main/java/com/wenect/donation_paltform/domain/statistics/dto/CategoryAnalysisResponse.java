package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 카테고리 분석 응답 DTO
 * 카테고리별 기부 통계
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryAnalysisResponse {

    /**
     * 카테고리 ID
     */
    private Integer categoryId;

    /**
     * 카테고리 이름
     */
    private String categoryName;

    /**
     * 총 기부액
     */
    private BigDecimal totalAmount;

    /**
     * 기부 건수
     */
    private Integer donationCount;

    /**
     * 전체 기부액 대비 비율 (%)
     */
    private Double percentage;
}
