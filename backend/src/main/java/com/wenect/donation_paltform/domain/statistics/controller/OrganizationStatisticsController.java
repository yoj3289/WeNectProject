package com.wenect.donation_paltform.domain.statistics.controller;

import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.statistics.dto.*;
import com.wenect.donation_paltform.domain.statistics.service.OrganizationStatisticsService;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 기관 프로젝트 통계 컨트롤러
 */
@RestController
@RequestMapping("/api/statistics/organization")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class OrganizationStatisticsController {

    private final OrganizationStatisticsService organizationStatisticsService;
    private final OrganizationRepository organizationRepository;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 기관 전체 통계 요약 조회
     */
    @GetMapping("/summary")
    public ResponseEntity<OrganizationStatisticsSummaryResponse> getOrganizationSummary(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long orgId = getOrgIdFromToken(authHeader);
        log.info("기관 전체 통계 요약 조회 - orgId: {}", orgId);

        OrganizationStatisticsSummaryResponse summary = organizationStatisticsService.getOrganizationSummary(orgId);
        return ResponseEntity.ok(summary);
    }

    /**
     * 개별 프로젝트 통계 목록 조회
     */
    @GetMapping("/projects")
    public ResponseEntity<List<ProjectStatisticsResponse>> getProjectStatistics(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long orgId = getOrgIdFromToken(authHeader);
        log.info("개별 프로젝트 통계 목록 조회 - orgId: {}", orgId);

        List<ProjectStatisticsResponse> statistics = organizationStatisticsService.getProjectStatistics(orgId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 프로젝트 기부 트렌드 조회
     *
     * @param projectId 특정 프로젝트 ID (null이면 기관 전체)
     * @param period 기간 구분 (monthly/yearly, 기본값: monthly)
     */
    @GetMapping("/donation-trends")
    public ResponseEntity<List<ProjectDonationTrendResponse>> getProjectDonationTrends(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "projectId", required = false) Long projectId,
            @RequestParam(value = "period", defaultValue = "monthly") String period) {

        Long orgId = getOrgIdFromToken(authHeader);
        log.info("프로젝트 기부 트렌드 조회 - orgId: {}, projectId: {}, period: {}", orgId, projectId, period);

        List<ProjectDonationTrendResponse> trends = organizationStatisticsService.getProjectDonationTrends(
                orgId, projectId, period);
        return ResponseEntity.ok(trends);
    }

    /**
     * 특정 프로젝트 상세 통계 조회
     */
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ProjectStatisticsResponse> getProjectDetailStatistics(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long projectId) {

        Long orgId = getOrgIdFromToken(authHeader);
        log.info("프로젝트 상세 통계 조회 - orgId: {}, projectId: {}", orgId, projectId);

        ProjectStatisticsResponse statistics = organizationStatisticsService.getProjectDetailStatistics(orgId, projectId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * JWT 토큰에서 orgId 추출
     */
    private Long getOrgIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }

        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.getUserId(token);

        // userId로 기관 조회
        return organizationRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."))
                .getOrgId();
    }
}
