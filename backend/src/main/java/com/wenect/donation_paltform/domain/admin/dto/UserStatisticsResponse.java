package com.wenect.donation_paltform.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 사용자별 활동 통계 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsResponse {

    /**
     * 총 기부 금액
     */
    private BigDecimal totalDonationAmount;

    /**
     * 기부 횟수
     */
    private Long donationCount;

    /**
     * 참여 프로젝트 수 (중복 제거)
     */
    private Long participatedProjects;
}
