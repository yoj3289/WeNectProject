package com.wenect.donation_paltform.domain.organization.service;

import com.wenect.donation_paltform.domain.organization.dto.OrganizationStatsResponse;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * 기관 관리 서비스
 * - 기관 대시보드 통계 및 프로젝트 관리 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final ProjectRepository projectRepository;

    /**
     * 기관 통계 조회
     * - 전체/진행 중/결산 중/종료 프로젝트 수
     * - 총 모금액, 진행 중 모금액, 저금통 잔액
     *
     * @param orgId 기관 ID
     * @return 통계 정보
     */
    @Transactional(readOnly = true)
    public OrganizationStatsResponse getOrganizationStats(Long orgId) {
        // 기관의 모든 프로젝트 조회
        List<Project> projects = projectRepository.findByOrgId(orgId);

        // 전체 프로젝트 수
        int totalProjects = projects.size();

        // 상태별 프로젝트 수 계산
        int activeProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .count();

        int settlementProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED ||
                           p.getStatus() == Project.ProjectStatus.SETTLEMENT)
                .count();

        int closedProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.CLOSED)
                .count();

        // 총 모금액 계산 (모든 프로젝트)
        BigDecimal totalFunding = projects.stream()
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 진행 중인 프로젝트 모금액
        BigDecimal activeFunding = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // TODO: 저금통 테이블 구현 후 실제 잔액 계산
        // 현재는 결산 중인 프로젝트의 모금액으로 임시 대체
        BigDecimal totalWalletBalance = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.SETTLEMENT)
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrganizationStatsResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .settlementProjects(settlementProjects)
                .closedProjects(closedProjects)
                .totalFunding(totalFunding)
                .activeFunding(activeFunding)
                .totalWalletBalance(totalWalletBalance)
                .build();
    }
}
