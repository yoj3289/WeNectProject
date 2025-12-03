package com.wenect.donation_paltform.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class ChartStatsResponse {

    /**
     * 기부 추이 데이터 (일별/주별/월별)
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DonationTrend {
        private String label;           // 날짜 라벨 (예: "12/01", "1주차", "1월")
        private BigDecimal amount;      // 기부 금액
        private Long count;             // 기부 건수
    }

    /**
     * 사용자 가입 추이 데이터
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserTrend {
        private String label;           // 날짜 라벨
        private Long individual;        // 일반 회원 수
        private Long organization;      // 기관 회원 수
        private Long total;             // 총 회원 수
    }

    /**
     * 프로젝트 상태별 통계 (전체, 진행 중, 결산 중, 종료, 반려)
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectStats {
        private Long ongoing;           // 진행 중 (ACTIVE)
        private Long settlement;        // 결산 중 (SETTLEMENT)
        private Long closed;            // 종료 (CLOSED, COMPLETED)
        private Long rejected;          // 반려 (REJECTED)
        private Long total;             // 전체
    }

    /**
     * 프로젝트 추이 데이터
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectTrend {
        private String label;           // 날짜 라벨
        private Long newProjects;       // 신규 프로젝트
        private Long completedProjects; // 완료된 프로젝트
    }

    /**
     * 기부 추이 응답
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DonationTrendResponse {
        private String period;          // "weekly" or "monthly"
        private List<DonationTrend> data;
        private BigDecimal totalAmount;
        private Long totalCount;
    }

    /**
     * 사용자 추이 응답
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserTrendResponse {
        private String period;          // "weekly" or "monthly"
        private List<UserTrend> data;
        private Long totalIndividual;
        private Long totalOrganization;
    }

    /**
     * 프로젝트 통계 응답
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectStatsResponse {
        private ProjectStats stats;
        private List<ProjectTrend> trend;
        private String period;          // "weekly" or "monthly"
    }
}
