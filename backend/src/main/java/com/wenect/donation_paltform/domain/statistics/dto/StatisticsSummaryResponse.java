package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 통계 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsSummaryResponse {

    /**
     * 전체 프로젝트 수 (활성 상태)
     */
    private Long totalProjects;

    /**
     * 총 기부자 수
     */
    private Long totalDonors;

    /**
     * 총 기부 금액
     */
    private BigDecimal totalDonationAmount;

    /**
     * 활성 프로젝트 수
     */
    private Long activeProjects;

    /**
     * 완료된 프로젝트 수
     */
    private Long completedProjects;
}
