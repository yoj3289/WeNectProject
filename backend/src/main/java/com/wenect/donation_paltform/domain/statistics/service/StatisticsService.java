package com.wenect.donation_paltform.domain.statistics.service;

import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.statistics.dto.StatisticsSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * 통계 서비스
 * [성능 개선] findAll() -> 집계 쿼리로 변경
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private final ProjectRepository projectRepository;

    /**
     * 전체 통계 요약 조회
     * [성능 개선] 단일 집계 쿼리로 모든 통계를 한 번에 조회
     */
    public StatisticsSummaryResponse getStatisticsSummary() {
        log.info("통계 요약 조회 시작");

        try {
            // DB에서 단일 쿼리로 모든 통계 조회
            Object[] rawResult = projectRepository.getStatisticsSummary();

            if (rawResult == null || rawResult.length == 0) {
                log.warn("통계 쿼리 결과가 null이거나 비어있음");
                return StatisticsSummaryResponse.builder()
                        .totalProjects(0L)
                        .totalDonors(0L)
                        .totalDonationAmount(BigDecimal.ZERO)
                        .activeProjects(0L)
                        .completedProjects(0L)
                        .build();
            }

            // Native query 결과가 Object[] 안에 Object[]로 래핑되어 있음
            Object[] stats;
            if (rawResult[0] instanceof Object[]) {
                stats = (Object[]) rawResult[0];
            } else {
                stats = rawResult;
            }

            log.info("통계 쿼리 결과 - 길이: {}, 값: {}", stats.length, java.util.Arrays.toString(stats));

            if (stats.length < 4) {
                log.warn("통계 쿼리 결과가 불완전함 - length: {}", stats.length);
                return StatisticsSummaryResponse.builder()
                        .totalProjects(0L)
                        .totalDonors(0L)
                        .totalDonationAmount(BigDecimal.ZERO)
                        .activeProjects(0L)
                        .completedProjects(0L)
                        .build();
            }

            long activeProjects = stats[0] != null ? ((Number) stats[0]).longValue() : 0L;
            long completedProjects = stats[1] != null ? ((Number) stats[1]).longValue() : 0L;
            long totalDonors = stats[2] != null ? ((Number) stats[2]).longValue() : 0L;
            BigDecimal totalDonationAmount = stats[3] != null ? new BigDecimal(stats[3].toString()) : BigDecimal.ZERO;

            StatisticsSummaryResponse response = StatisticsSummaryResponse.builder()
                    .totalProjects(activeProjects) // 홈페이지에서는 활성 프로젝트만 표시
                    .totalDonors(totalDonors)
                    .totalDonationAmount(totalDonationAmount)
                    .activeProjects(activeProjects)
                    .completedProjects(completedProjects)
                    .build();

            log.info("통계 요약 조회 완료 - 활성: {}, 완료: {}, 기부자: {}, 총액: {}",
                    activeProjects, completedProjects, totalDonors, totalDonationAmount);

            return response;
        } catch (Exception e) {
            log.error("통계 요약 조회 중 오류: {}", e.getMessage(), e);
            return StatisticsSummaryResponse.builder()
                    .totalProjects(0L)
                    .totalDonors(0L)
                    .totalDonationAmount(BigDecimal.ZERO)
                    .activeProjects(0L)
                    .completedProjects(0L)
                    .build();
        }
    }
}
