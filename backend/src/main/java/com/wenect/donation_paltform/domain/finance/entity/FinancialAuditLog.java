package com.wenect.donation_paltform.domain.finance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 금융 감사 로그 엔티티
 * 모든 금융 관련 행동을 기록 (누가 언제 무엇을 했는지)
 */
@Entity
@Table(name = "financial_audit_logs", indexes = {
    @Index(name = "IDX_audit_entity", columnList = "entity_type, entity_id"),
    @Index(name = "IDX_audit_action", columnList = "action, created_at DESC"),
    @Index(name = "IDX_audit_performed_by", columnList = "performed_by, created_at DESC"),
    @Index(name = "IDX_audit_created", columnList = "created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuditAction action;  // 수행한 행동

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;  // 대상 엔티티 타입 (Settlement, Expense, PgSettlement 등)

    @Column(name = "entity_id", nullable = false)
    private Long entityId;  // 대상 엔티티 ID

    @Column(name = "before_state", columnDefinition = "TEXT")
    private String beforeState;  // 변경 전 상태 (JSON)

    @Column(name = "after_state", columnDefinition = "TEXT")
    private String afterState;  // 변경 후 상태 (JSON)

    @Column(name = "changed_fields", columnDefinition = "TEXT")
    private String changedFields;  // 변경된 필드 목록 (JSON)

    // 수행자 정보
    @Column(name = "performed_by", nullable = false)
    private Long performedBy;  // 수행자 ID

    @Column(name = "performed_by_email", length = 100)
    private String performedByEmail;  // 수행자 이메일

    @Enumerated(EnumType.STRING)
    @Column(name = "performed_by_role", nullable = false, length = 20)
    private PerformerRole performedByRole;  // 수행자 역할

    // 요청 정보 (보안)
    @Column(name = "ip_address", length = 45)
    private String ipAddress;  // 요청 IP

    @Column(name = "user_agent", length = 500)
    private String userAgent;  // 요청 User-Agent

    @Column(name = "request_id", length = 100)
    private String requestId;  // 요청 ID (추적용)

    // 추가 정보
    @Column(columnDefinition = "TEXT")
    private String description;  // 상세 설명

    @Column(columnDefinition = "TEXT")
    private String reason;  // 행동 사유 (반려 사유 등)

    // 관련 엔티티 (빠른 조회용)
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "organization_id")
    private Long organizationId;

    @Column(name = "donation_id")
    private Long donationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * 감사 행동 유형
     */
    public enum AuditAction {
        // 생성
        CREATE,

        // 조회 (민감 정보)
        VIEW_SENSITIVE,

        // 수정
        UPDATE,

        // 상태 변경
        APPROVE,
        REJECT,
        CANCEL,
        COMPLETE,

        // 금액 관련
        DEPOSIT,
        WITHDRAW,
        REFUND,
        ADJUSTMENT,

        // 대사
        RECONCILE,
        RECONCILE_ADJUST,

        // 삭제 (소프트/하드)
        SOFT_DELETE,
        HARD_DELETE,

        // 복구
        RESTORE,

        // 내보내기
        EXPORT
    }

    /**
     * 수행자 역할
     */
    public enum PerformerRole {
        SYSTEM,         // 시스템 자동 처리
        SUPER_ADMIN,    // 슈퍼 관리자
        ADMIN,          // 관리자
        ORGANIZATION,   // 기관
        USER            // 일반 사용자
    }

    /**
     * 감사 로그 생성 빌더 헬퍼
     */
    public static FinancialAuditLogBuilder createLog(
            AuditAction action,
            String entityType,
            Long entityId,
            Long performedBy,
            PerformerRole role
    ) {
        return FinancialAuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .performedBy(performedBy)
                .performedByRole(role);
    }

    /**
     * 승인 로그 생성
     */
    public static FinancialAuditLog createApprovalLog(
            String entityType,
            Long entityId,
            Long performedBy,
            String performedByEmail,
            PerformerRole role,
            String beforeState,
            String afterState,
            String ipAddress
    ) {
        return FinancialAuditLog.builder()
                .action(AuditAction.APPROVE)
                .entityType(entityType)
                .entityId(entityId)
                .performedBy(performedBy)
                .performedByEmail(performedByEmail)
                .performedByRole(role)
                .beforeState(beforeState)
                .afterState(afterState)
                .ipAddress(ipAddress)
                .build();
    }

    /**
     * 반려 로그 생성
     */
    public static FinancialAuditLog createRejectionLog(
            String entityType,
            Long entityId,
            Long performedBy,
            String performedByEmail,
            PerformerRole role,
            String reason,
            String beforeState,
            String afterState,
            String ipAddress
    ) {
        return FinancialAuditLog.builder()
                .action(AuditAction.REJECT)
                .entityType(entityType)
                .entityId(entityId)
                .performedBy(performedBy)
                .performedByEmail(performedByEmail)
                .performedByRole(role)
                .reason(reason)
                .beforeState(beforeState)
                .afterState(afterState)
                .ipAddress(ipAddress)
                .build();
    }
}
