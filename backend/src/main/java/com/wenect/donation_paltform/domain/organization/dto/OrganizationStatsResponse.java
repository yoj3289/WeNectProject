package com.wenect.donation_paltform.domain.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 기관 통계 응답 DTO
 * - 기관이 등록한 프로젝트 전체 통계 요약
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationStatsResponse {

    /**
     * 전체 프로젝트 수
     */
    private Integer totalProjects;

    /**
     * 진행 중인 프로젝트 수 (ACTIVE)
     */
    private Integer activeProjects;

    /**
     * 결산 중인 프로젝트 수 (COMPLETED, SETTLEMENT)
     */
    private Integer settlementProjects;

    /**
     * 종료된 프로젝트 수 (CLOSED)
     */
    private Integer closedProjects;

    /**
     * 총 모금액 (모든 프로젝트 합계)
     */
    private BigDecimal totalFunding;

    /**
     * 진행 중인 프로젝트의 현재 모금액
     */
    private BigDecimal activeFunding;

    /**
     * 총 저금통 잔액 (결산 중인 프로젝트의 잔액 합계)
     */
    private BigDecimal totalWalletBalance;
}
