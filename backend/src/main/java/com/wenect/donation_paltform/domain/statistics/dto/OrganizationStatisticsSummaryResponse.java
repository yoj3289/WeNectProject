package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 기관 전체 통계 요약 응답 DTO
 */
@Data
@Builder
public class OrganizationStatisticsSummaryResponse {
    private Integer totalProjects;
    private Integer activeProjects;
    private Integer completedProjects;
    private Integer closedProjects;
    private BigDecimal totalDonationAmount;
    private Integer totalDonorCount;
    private Integer totalDonationCount;
    private BigDecimal averageDonation;
    private BigDecimal averageAchievementRate;
}
