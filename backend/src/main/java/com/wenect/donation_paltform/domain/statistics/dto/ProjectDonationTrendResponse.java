package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 프로젝트 기부 트렌드 응답 DTO (기관용)
 */
@Data
@Builder
public class ProjectDonationTrendResponse {
    private String period;
    private BigDecimal totalAmount;
    private Integer donationCount;
    private Integer donorCount;
}
