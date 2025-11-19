package com.wenect.donation_paltform.domain.admin.controller;

import com.wenect.donation_paltform.domain.admin.dto.CategoryDistributionResponse;
import com.wenect.donation_paltform.domain.admin.dto.DashboardStatsResponse;
import com.wenect.donation_paltform.domain.admin.service.AdminDashboardService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

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
}
