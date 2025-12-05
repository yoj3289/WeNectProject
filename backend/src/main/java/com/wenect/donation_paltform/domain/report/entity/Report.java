package com.wenect.donation_paltform.domain.report.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports", indexes = {
    @Index(name = "idx_report_status", columnList = "status"),
    @Index(name = "idx_report_type", columnList = "reportType"),
    @Index(name = "idx_report_user", columnList = "userId"),
    @Index(name = "idx_report_created", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    // 신고한 사용자 ID
    @Column(nullable = false)
    private Long userId;

    // 신고 대상 사용자 ID (댓글/게시글/프로젝트 작성자)
    private Long reportedUserId;

    // 신고 대상 아이템 ID (댓글/게시글/프로젝트 ID)
    @Column(nullable = false)
    private Long reportedItemId;

    // 신고 유형
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportType reportType;

    // 신고 사유
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportReason reason;

    // 상세 설명
    @Column(length = 1000)
    private String description;

    // 신고 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    // 관리자 메모
    @Column(length = 500)
    private String adminNote;

    // 처리한 관리자 ID
    private Long processedByAdminId;

    // 소프트 삭제
    @Builder.Default
    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 신고 유형 Enum
    public enum ReportType {
        COMMENT,    // 댓글
        POST,       // 게시글
        PROJECT,    // 프로젝트
        USER        // 사용자
    }

    // 신고 사유 Enum
    public enum ReportReason {
        INAPPROPRIATE_CONTENT,  // 부적절한 콘텐츠
        SPAM,                   // 스팸
        HARASSMENT,             // 괴롭힘/혐오
        FRAUD,                  // 사기/허위정보
        COPYRIGHT,              // 저작권 침해
        PERSONAL_INFO,          // 개인정보 노출
        OTHER                   // 기타
    }

    // 신고 상태 Enum
    public enum ReportStatus {
        PENDING,        // 대기중
        UNDER_REVIEW,   // 검토중
        RESOLVED,       // 처리완료
        REJECTED        // 반려됨
    }

    // 신고 처리 메서드
    public void process(ReportStatus newStatus, String adminNote, Long adminId) {
        this.status = newStatus;
        this.adminNote = adminNote;
        this.processedByAdminId = adminId;
        this.processedAt = LocalDateTime.now();
    }

    // 소프트 삭제
    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }
}
