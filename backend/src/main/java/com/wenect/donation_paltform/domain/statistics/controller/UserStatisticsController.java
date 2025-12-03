package com.wenect.donation_paltform.domain.statistics.controller;

import com.wenect.donation_paltform.domain.statistics.dto.*;
import com.wenect.donation_paltform.domain.statistics.service.UserStatisticsService;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 일반 사용자 기부 통계 컨트롤러
 */
@RestController
@RequestMapping("/api/statistics/user")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class UserStatisticsController {

    private final UserStatisticsService userStatisticsService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 기부 트렌드 조회 (월별/연별)
     *
     * @param period 기간 구분 (monthly/yearly, 기본값: monthly)
     * @param year 연도 필터 (optional, monthly일 때 사용)
     * @return 기부 트렌드 목록
     */
    @GetMapping("/donation-trends")
    public ResponseEntity<List<DonationTrendResponse>> getDonationTrends(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "period", defaultValue = "monthly") String period,
            @RequestParam(value = "year", required = false) Integer year) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("기부 트렌드 조회 요청 - userId: {}, period: {}, year: {}", userId, period, year);

        List<DonationTrendResponse> trends = userStatisticsService.getDonationTrends(userId, period, year);
        return ResponseEntity.ok(trends);
    }

    /**
     * 카테고리 분석 조회
     * 카테고리별 총 기부액, 기부 건수, 비율
     *
     * @return 카테고리 분석 목록
     */
    @GetMapping("/category-analysis")
    public ResponseEntity<List<CategoryAnalysisResponse>> getCategoryAnalysis(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("카테고리 분석 조회 요청 - userId: {}", userId);

        List<CategoryAnalysisResponse> analysis = userStatisticsService.getCategoryAnalysis(userId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * 기부 타임라인 조회
     * 시간순으로 정렬된 기부 내역
     *
     * @return 기부 타임라인 목록
     */
    @GetMapping("/donation-timeline")
    public ResponseEntity<List<DonationTimelineResponse>> getDonationTimeline(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("기부 타임라인 조회 요청 - userId: {}", userId);

        List<DonationTimelineResponse> timeline = userStatisticsService.getDonationTimeline(userId);
        return ResponseEntity.ok(timeline);
    }

    /**
     * 관심 카테고리 분포 조회
     * 카테고리별 기부한 프로젝트 수 및 비율
     *
     * @return 관심 카테고리 분포 목록
     */
    @GetMapping("/favorite-category-distribution")
    public ResponseEntity<List<FavoriteCategoryDistributionResponse>> getFavoriteCategoryDistribution(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("관심 카테고리 분포 조회 요청 - userId: {}", userId);

        List<FavoriteCategoryDistributionResponse> distribution =
                userStatisticsService.getFavoriteCategoryDistribution(userId);
        return ResponseEntity.ok(distribution);
    }

    /**
     * JWT 토큰에서 userId 추출
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }

        String token = authHeader.substring(7); // "Bearer " 제거
        return jwtTokenProvider.getUserId(token);
    }
}
