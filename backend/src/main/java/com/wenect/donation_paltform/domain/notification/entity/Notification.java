package com.wenect.donation_paltform.domain.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 알림 엔티티
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    /**
     * 알림을 받을 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 알림 타입
     * donation, comment, reply, project_approval, project_rejection, goal_achieved, deadline_soon, settlement
     */
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    /**
     * 알림 카테고리
     * donation, community, project, settlement
     */
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    /**
     * 알림 제목
     */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * 알림 메시지
     */
    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    /**
     * 알림 클릭 시 이동할 링크 (선택)
     */
    @Column(name = "link", length = 500)
    private String link;

    /**
     * 읽음 여부
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * 보관 여부
     */
    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private Boolean isArchived = false;

    /**
     * 메타데이터 (JSON 형식으로 저장)
     * 예: {"projectName": "어린이 급식 지원", "amount": "50000", "priority": "high"}
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * 생성 일시
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 읽은 일시
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * 알림을 읽음으로 표시
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * 알림을 보관함으로 이동
     */
    public void archive() {
        this.isArchived = true;
    }
}
