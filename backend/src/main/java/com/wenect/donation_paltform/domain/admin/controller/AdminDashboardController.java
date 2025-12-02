package com.wenect.donation_paltform.domain.admin.controller;

import com.wenect.donation_paltform.domain.admin.dto.CategoryDistributionResponse;
import com.wenect.donation_paltform.domain.admin.dto.ChartStatsResponse.*;
import com.wenect.donation_paltform.domain.admin.dto.DashboardStatsResponse;
import com.wenect.donation_paltform.domain.admin.dto.SystemMetricsResponse;
import com.wenect.donation_paltform.domain.admin.service.AdminDashboardService;
import com.wenect.donation_paltform.domain.admin.service.ChartStatsService;
import com.wenect.donation_paltform.domain.admin.service.SystemMetricsService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final SystemMetricsService systemMetricsService;
    private final ChartStatsService chartStatsService;

    /**
     * 대시보드 통계 조회
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "대시보드 통계 조회 성공"));
    }

    /**
     * 카테고리별 프로젝트 분포 조회
     */
    @GetMapping("/metrics/category-distribution")
    public ResponseEntity<ApiResponse<List<CategoryDistributionResponse>>> getCategoryDistribution() {
        List<CategoryDistributionResponse> distribution = adminDashboardService.getCategoryDistribution();
        return ResponseEntity.ok(ApiResponse.success(distribution, "카테고리 분포 조회 성공"));
    }

    /**
     * 시스템 메트릭 조회
     */
    @GetMapping("/metrics/system")
    public ResponseEntity<ApiResponse<SystemMetricsResponse>> getSystemMetrics() {
        SystemMetricsResponse metrics = systemMetricsService.getSystemMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics, "시스템 메트릭 조회 성공"));
    }

    /**
     * 기부 추이 차트 데이터 조회
     * @param period "weekly" or "monthly"
     */
    @GetMapping("/charts/donation-trend")
    public ResponseEntity<ApiResponse<DonationTrendResponse>> getDonationTrend(
            @RequestParam(defaultValue = "weekly") String period) {
        DonationTrendResponse trend = chartStatsService.getDonationTrend(period);
        return ResponseEntity.ok(ApiResponse.success(trend, "기부 추이 조회 성공"));
    }

    /**
     * 사용자 가입 추이 차트 데이터 조회
     * @param period "weekly" or "monthly"
     */
    @GetMapping("/charts/user-trend")
    public ResponseEntity<ApiResponse<UserTrendResponse>> getUserTrend(
            @RequestParam(defaultValue = "weekly") String period) {
        UserTrendResponse trend = chartStatsService.getUserTrend(period);
        return ResponseEntity.ok(ApiResponse.success(trend, "사용자 가입 추이 조회 성공"));
    }

    /**
     * 프로젝트 통계 및 추이 차트 데이터 조회
     * @param period "weekly" or "monthly"
     */
    @GetMapping("/charts/project-stats")
    public ResponseEntity<ApiResponse<ProjectStatsResponse>> getProjectStats(
            @RequestParam(defaultValue = "weekly") String period) {
        ProjectStatsResponse stats = chartStatsService.getProjectStats(period);
        return ResponseEntity.ok(ApiResponse.success(stats, "프로젝트 통계 조회 성공"));
    }
}
