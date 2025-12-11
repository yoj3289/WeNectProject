package com.wenect.donation_paltform.domain.project.dto;

import lombok.*;

/**
 * 프로젝트 수정 요청 DTO
 * - 제목, 소개는 ACTIVE/COMPLETED 상태에서 수정 가능
 * - 기부금 사용계획은 COMPLETED 상태에서만 수정 가능 (변경 사유 필수)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProjectRequest {

    private String title;                   // 프로젝트 제목
    private String description;             // 프로젝트 소개 (HTML)
    private String budgetPlan;              // 기부금 사용계획
    private String budgetPlanChangeReason;  // 사용계획 변경 사유 (COMPLETED 상태에서 필수)
}
