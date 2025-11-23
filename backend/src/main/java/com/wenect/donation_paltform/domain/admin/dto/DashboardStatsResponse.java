package com.wenect.donation_paltform.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    // 오늘 기부 금액
    private BigDecimal todayDonation;

    // 전일 대비 기부 금액 증감률 (%)
    private Double donationChange;

    // 이번주 신규 회원 수
    private Long newUsers;

    // 지난주 대비 신규 회원 증감률 (%)
    private Double userChange;

    // 승인 대기 (목업 데이터)
    private Integer pendingApprovals;

    // 정산 승인 대기 (목업 데이터)
    private Integer pendingSettlements;

    // 지출 승인 대기
    private Long pendingExpenses;
}
