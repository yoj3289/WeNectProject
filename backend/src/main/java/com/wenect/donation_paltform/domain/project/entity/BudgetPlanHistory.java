package com.wenect.donation_paltform.domain.project.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 기부금 사용계획 변경 이력 엔티티
 * - 모금 완료 후 사용계획 변경 시 이력 저장
 * - 기부자에게 투명성 제공
 */
@Entity
@Table(name = "budget_plan_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetPlanHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    // 변경 전 사용계획
    @Column(name = "previous_plan", columnDefinition = "TEXT")
    private String previousPlan;

    // 변경 후 사용계획
    @Column(name = "new_plan", columnDefinition = "TEXT")
    private String newPlan;

    // 변경 사유 (필수)
    @Column(name = "change_reason", columnDefinition = "TEXT", nullable = false)
    private String changeReason;

    // 변경한 사용자 ID (기관 담당자)
    @Column(name = "changed_by")
    private Long changedBy;

    // 변경 시점
    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;

    // 변경 시점의 프로젝트 상태
    @Column(name = "project_status", length = 20)
    private String projectStatus;
}
