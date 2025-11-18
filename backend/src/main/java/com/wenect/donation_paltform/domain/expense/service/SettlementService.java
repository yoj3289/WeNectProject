package com.wenect.donation_paltform.domain.expense.service;

import com.wenect.donation_paltform.domain.expense.dto.SettlementSummaryResponse;
import com.wenect.donation_paltform.domain.expense.entity.Expense;
import com.wenect.donation_paltform.domain.expense.repository.ExpenseRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private final ProjectRepository projectRepository;
    private final ExpenseRepository expenseRepository;

    /**
     * 프로젝트 결산 요약 조회
     */
    @Transactional(readOnly = true)
    public SettlementSummaryResponse getSettlementSummary(Long projectId) {
        // 프로젝트 정보 조회
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 프로젝트 상태 확인 (COMPLETED, SETTLEMENT, CLOSED 상태만 조회 가능)
        if (project.getStatus() != Project.ProjectStatus.COMPLETED &&
            project.getStatus() != Project.ProjectStatus.SETTLEMENT &&
            project.getStatus() != Project.ProjectStatus.CLOSED) {
            throw new IllegalStateException("완료된 프로젝트만 결산 조회가 가능합니다.");
        }

        // 승인된 지출 총액 계산
        BigDecimal usedAmount = expenseRepository.sumApprovedAmountByProjectId(projectId);
        if (usedAmount == null) {
            usedAmount = BigDecimal.ZERO;
        }

        // 승인된 지출 건수
        Long expenseCount = expenseRepository.countByProjectIdAndStatus(
                projectId,
                Expense.ExpenseStatus.APPROVED
        );

        // 잔여 금액 계산
        BigDecimal remainingAmount = project.getCurrentAmount().subtract(usedAmount);

        // 결산 상태 결정
        String settlementStatus = determineSettlementStatus(project.getStatus(), expenseCount);

        log.info("프로젝트 결산 요약 조회 - projectId: {}, totalAmount: {}, usedAmount: {}, remainingAmount: {}",
                projectId, project.getCurrentAmount(), usedAmount, remainingAmount);

        return SettlementSummaryResponse.builder()
                .projectId(projectId)
                .projectTitle(project.getTitle())
                .totalAmount(project.getCurrentAmount())
                .usedAmount(usedAmount)
                .remainingAmount(remainingAmount)
                .expenseCount(expenseCount)
                .donorCount(project.getDonorCount())
                .completedDate(project.getEndDate())
                .settlementStatus(settlementStatus)
                .remainingPlan(null) // TODO: 잔여금 처리 계획은 추후 구현
                .build();
    }

    /**
     * 결산 상태 결정
     */
    private String determineSettlementStatus(Project.ProjectStatus projectStatus, Long expenseCount) {
        if (projectStatus == Project.ProjectStatus.CLOSED) {
            return "completed";
        } else if (projectStatus == Project.ProjectStatus.SETTLEMENT) {
            return expenseCount > 0 ? "in_progress" : "pending";
        } else {
            return "pending";
        }
    }
}
