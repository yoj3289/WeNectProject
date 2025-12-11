package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 개별 프로젝트 통계 응답 DTO
 */
@Data
@Builder
public class ProjectStatisticsResponse {
    private Long projectId;
    private String projectTitle;
    private String status;
    private Integer categoryId;
    private String categoryName;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private BigDecimal achievementRate;
    private Integer donorCount;
    private Integer donationCount;
    private BigDecimal averageDonation;
    private String startDate;
    private String endDate;
}
