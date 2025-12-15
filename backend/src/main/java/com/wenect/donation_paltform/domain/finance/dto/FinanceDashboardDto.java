package com.wenect.donation_paltform.domain.finance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class FinanceDashboardDto {

    /**
     * 재정 현황 요약
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryResponse {
        // 전체 현황
        private BigDecimal totalDonationAmount;      // 총 기부 접수액
        private BigDecimal totalPgFees;              // 총 PG 수수료
        private BigDecimal totalPlatformReceived;    // 플랫폼 총 수령액
        private BigDecimal totalOrgSettlements;      // 기관 총 정산액
        private BigDecimal totalPlatformFees;        // 플랫폼 총 수수료 수익
        private BigDecimal currentPlatformBalance;   // 현재 플랫폼 잔액

        // 기간별 현황 (오늘/이번 주/이번 달)
        private PeriodSummary today;
        private PeriodSummary thisWeek;
        private PeriodSummary thisMonth;

        // 대기중인 항목
        private Integer pendingPgSettlements;        // 대기중인 PG 정산
        private Integer pendingOrgSettlements;       // 대기중인 기관 정산
        private Integer mismatchedSettlements;       // 불일치 정산 건수
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PeriodSummary {
        private BigDecimal donations;
        private BigDecimal pgSettlements;
        private BigDecimal orgSettlements;
        private BigDecimal platformFees;
        private Long donationCount;
        private Long settlementCount;
    }

    /**
     * 일별 재정 현황
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyReport {
        private LocalDate date;
        private BigDecimal donationAmount;
        private Integer donationCount;
        private BigDecimal pgSettlementAmount;
        private BigDecimal orgSettlementAmount;
        private BigDecimal platformFeeAmount;
        private BigDecimal netChange;  // 순 변동 (입금 - 출금)
        private BigDecimal closingBalance;  // 마감 잔액
    }

    /**
     * PG사별 현황
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PgProviderSummary {
        private String pgProvider;
        private BigDecimal totalTransactions;
        private BigDecimal totalFees;
        private BigDecimal totalSettlements;
        private Long transactionCount;
        private BigDecimal averageFeeRate;
    }

    /**
     * 기관별 정산 현황
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrganizationSettlementSummary {
        private Long organizationId;
        private String organizationName;
        private BigDecimal totalDonationsReceived;
        private BigDecimal totalSettled;
        private BigDecimal pendingSettlement;
        private Long projectCount;
    }

    /**
     * 대시보드 전체 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardResponse {
        private SummaryResponse summary;
        private List<DailyReport> recentDailyReports;
        private List<PgProviderSummary> pgProviderSummaries;
        private List<PlatformLedgerDto.Response> recentLedgerEntries;
        private List<AlertItem> alerts;
    }

    /**
     * 알림 항목
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertItem {
        private AlertType type;
        private String message;
        private String entityType;
        private Long entityId;
        private LocalDate date;
    }

    public enum AlertType {
        MISMATCH,           // 금액 불일치
        PENDING_APPROVAL,   // 승인 대기
        RECONCILIATION_DUE, // 대사 필요
        LOW_BALANCE,        // 잔액 부족
        LARGE_TRANSACTION   // 대규모 거래
    }
}
