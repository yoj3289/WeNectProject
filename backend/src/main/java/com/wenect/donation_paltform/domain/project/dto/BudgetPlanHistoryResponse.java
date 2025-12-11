package com.wenect.donation_paltform.domain.project.dto;

import com.wenect.donation_paltform.domain.project.entity.BudgetPlanHistory;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 기부금 사용계획 변경 이력 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetPlanHistoryResponse {

    private Long historyId;
    private Long projectId;
    private String previousPlan;
    private String newPlan;
    private String changeReason;
    private LocalDateTime changedAt;
    private String projectStatus;

    public static BudgetPlanHistoryResponse from(BudgetPlanHistory history) {
        return BudgetPlanHistoryResponse.builder()
                .historyId(history.getHistoryId())
                .projectId(history.getProjectId())
                .previousPlan(history.getPreviousPlan())
                .newPlan(history.getNewPlan())
                .changeReason(history.getChangeReason())
                .changedAt(history.getChangedAt())
                .projectStatus(history.getProjectStatus())
                .build();
    }
}
