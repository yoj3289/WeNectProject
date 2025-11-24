package com.wenect.donation_paltform.domain.expense.service;

import com.wenect.donation_paltform.domain.expense.dto.SettlementSummaryResponse;
import com.wenect.donation_paltform.domain.expense.entity.Expense;
import com.wenect.donation_paltform.domain.expense.repository.ExpenseRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.settlement.entity.Settlement;
import com.wenect.donation_paltform.domain.settlement.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private final ProjectRepository projectRepository;
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;

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

        // 정산 요청 조회
        Optional<Settlement> latestSettlement = settlementRepository.findFirstByProjectIdOrderByRequestedAtDesc(projectId);

        // 결산 상태 결정
        String settlementStatus = determineSettlementStatus(project.getStatus(), latestSettlement);

        log.info("프로젝트 결산 요약 조회 - projectId: {}, totalAmount: {}, usedAmount: {}, remainingAmount: {}, settlementStatus: {}",
                projectId, project.getCurrentAmount(), usedAmount, remainingAmount, settlementStatus);

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
     * - no_request: 정산 요청이 없음 (정산 요청 대기중)
     * - pending: 정산 요청 제출됨 또는 반려됨 (정산 대기 중)
     * - in_progress: 정산 요청 승인됨 (결산 진행 중)
     * - completed: 정산 완료 (결산 완료)
     */
    private String determineSettlementStatus(Project.ProjectStatus projectStatus, Optional<Settlement> latestSettlement) {
        // 정산 요청이 없는 경우
        if (latestSettlement.isEmpty()) {
            return "no_request";
        }

        Settlement settlement = latestSettlement.get();

        // 정산 요청 상태에 따른 처리
        switch (settlement.getStatus()) {
            case PENDING:
                return "pending";      // 정산 대기 중
            case REJECTED:
                return "pending";      // 반려 후 재요청 대기 중
            case APPROVED:
                return "in_progress";  // 결산 진행 중
            case COMPLETED:
                return "completed";    // 결산 완료
            default:
                return "no_request";
        }
    }
}
