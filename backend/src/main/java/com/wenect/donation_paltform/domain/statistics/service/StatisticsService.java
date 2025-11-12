package com.wenect.donation_paltform.domain.statistics.service;

import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.statistics.dto.StatisticsSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * 통계 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatisticsService {

    private final ProjectRepository projectRepository;

    /**
     * 전체 통계 요약 조회
     */
    public StatisticsSummaryResponse getStatisticsSummary() {
        log.info("통계 요약 조회 시작");

        // 모든 프로젝트 조회
        List<Project> allProjects = projectRepository.findAll();

        // 활성 프로젝트 수 (ACTIVE 상태)
        long activeProjects = allProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .count();

        // 완료된 프로젝트 수 (COMPLETED 상태)
        long completedProjects = allProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED)
                .count();

        // 총 기부자 수 (모든 프로젝트의 donorCount 합계)
        long totalDonors = allProjects.stream()
                .mapToLong(p -> p.getDonorCount() != null ? p.getDonorCount() : 0)
                .sum();

        // 총 기부 금액 (모든 프로젝트의 currentAmount 합계)
        BigDecimal totalDonationAmount = allProjects.stream()
                .map(p -> p.getCurrentAmount() != null ? p.getCurrentAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

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
    }
}
