package com.wenect.donation_paltform.domain.statistics.controller;

import com.wenect.donation_paltform.domain.statistics.dto.StatisticsSummaryResponse;
import com.wenect.donation_paltform.domain.statistics.service.StatisticsService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 통계 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * 전체 통계 요약 조회 (홈페이지용)
     *
     * @return 통계 요약 정보
     */
    @GetMapping("/summary")
    public ResponseEntity<StatisticsSummaryResponse> getStatisticsSummary() {
        log.info("GET /api/statistics/summary - 통계 요약 조회 요청");

        try {
            StatisticsSummaryResponse response = statisticsService.getStatisticsSummary();
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("통계 요약 조회 중 오류 발생", e);
            // 에러 발생 시 기본값 반환 (0으로 초기화)
            StatisticsSummaryResponse emptyResponse = StatisticsSummaryResponse.builder()
                    .totalProjects(0L)
                    .totalDonors(0L)
                    .totalDonationAmount(java.math.BigDecimal.ZERO)
                    .activeProjects(0L)
                    .completedProjects(0L)
                    .build();
            return ResponseEntity.ok(emptyResponse);
        }
    }
}
