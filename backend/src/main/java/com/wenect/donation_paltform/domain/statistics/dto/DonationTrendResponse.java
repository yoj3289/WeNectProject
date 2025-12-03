package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 기부 트렌드 응답 DTO
 * 월별/연별 기부 통계
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationTrendResponse {

    /**
     * 기간 (monthly: "2025-01", yearly: "2025")
     */
    private String period;

    /**
     * 해당 기간 총 기부액
     */
    private BigDecimal totalAmount;

    /**
     * 기부 건수
     */
    private Integer donationCount;
}
