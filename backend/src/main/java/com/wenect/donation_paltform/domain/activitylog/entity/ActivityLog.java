package com.wenect.donation_paltform.domain.activitylog.entity;

import com.wenect.donation_paltform.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 활동 로그 엔티티
 * 사용자의 주요 활동을 기록
 */
@Entity
@Table(name = "activity_logs",
        indexes = {
                @Index(name = "idx_user_id", columnList = "user_id"),
                @Index(name = "idx_created_at", columnList = "created_at"),
                @Index(name = "idx_activity_type", columnList = "activity_type")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    /**
     * 사용자 ID
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 활동 타입
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 50)
    private ActivityType activityType;

    /**
     * 활동 상세 설명
     */
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    /**
     * IP 주소
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * 생성 시간
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 활동 타입 열거형
     */
    public enum ActivityType {
        LOGIN,              // 로그인
        DONATION,           // 기부 완료
        PROFILE_UPDATE      // 프로필 수정
    }

    /**
     * 정적 팩토리 메서드 - 로그인
     */
    public static ActivityLog createLoginLog(User user, String ipAddress) {
        return ActivityLog.builder()
                .user(user)
                .activityType(ActivityType.LOGIN)
                .details("정상 로그인")
                .ipAddress(ipAddress)
                .build();
    }

    /**
     * 정적 팩토리 메서드 - 기부 완료
     */
    public static ActivityLog createDonationLog(User user, String projectTitle, Long amount, String ipAddress) {
        return ActivityLog.builder()
                .user(user)
                .activityType(ActivityType.DONATION)
                .details(String.format("%s - %,d원", projectTitle, amount))
                .ipAddress(ipAddress)
                .build();
    }

    /**
     * 정적 팩토리 메서드 - 프로필 수정
     */
    public static ActivityLog createProfileUpdateLog(User user, String updateType, String ipAddress) {
        return ActivityLog.builder()
                .user(user)
                .activityType(ActivityType.PROFILE_UPDATE)
                .details(updateType)
                .ipAddress(ipAddress)
                .build();
    }
}
