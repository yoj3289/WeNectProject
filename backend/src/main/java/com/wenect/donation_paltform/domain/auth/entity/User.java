package com.wenect.donation_paltform.domain.auth.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    
    @Column(unique = true, nullable = false, length = 100)
    private String email;
    
    @Column(nullable = false, length = 255)
    private String password;
    
    @Column(name = "user_name", nullable = false, length = 50)
    private String userName;
    
    @Column(length = 20)
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private UserType userType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 탈퇴 요청 일시 (30일 후 완전 삭제)
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * 탈퇴 사유 (선택사항)
     */
    @Column(name = "delete_reason", length = 500)
    private String deleteReason;

    /**
     * 알림 설정 (JSON 형식)
     */
    @Column(name = "notification_settings", columnDefinition = "TEXT")
    private String notificationSettings;

    /**
     * 경고 횟수 (신고 처리 시 증가)
     * 3회: 경고, 5회: 정지, 7회: 영구정지
     */
    @Column(name = "warning_count")
    @Builder.Default
    private Integer warningCount = 0;

    /**
     * 정지 해제 예정 일시 (정지 상태일 때만 사용)
     */
    @Column(name = "suspension_end_at")
    private LocalDateTime suspensionEndAt;

    /**
     * 마지막 제재 사유
     */
    @Column(name = "last_penalty_reason", length = 500)
    private String lastPenaltyReason;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum UserType {
        INDIVIDUAL, ORGANIZATION, ADMIN
    }
    
    public enum UserStatus {
        ACTIVE,             // 정상
        INACTIVE,           // 비활성
        SUSPENDED,          // 정지 (임시)
        PERMANENTLY_BANNED, // 영구정지
        DELETED             // 탈퇴 (30일간 유예)
    }

    /**
     * 경고 횟수 증가 및 제재 적용
     * @return 적용된 제재 유형 (WARNING, SUSPENDED, PERMANENTLY_BANNED)
     */
    public String applyPenalty(String reason) {
        this.warningCount = (this.warningCount == null ? 0 : this.warningCount) + 1;
        this.lastPenaltyReason = reason;

        if (this.warningCount >= 7) {
            // 7회 이상: 영구정지
            this.status = UserStatus.PERMANENTLY_BANNED;
            return "PERMANENTLY_BANNED";
        } else if (this.warningCount >= 5) {
            // 5회 이상: 30일 정지
            this.status = UserStatus.SUSPENDED;
            this.suspensionEndAt = LocalDateTime.now().plusDays(30);
            return "SUSPENDED";
        } else if (this.warningCount >= 3) {
            // 3회 이상: 경고 (상태는 유지)
            return "WARNING";
        }
        return "NONE";
    }

    /**
     * 정지 상태 확인 및 해제
     */
    public boolean checkAndReleaseSuspension() {
        if (this.status == UserStatus.SUSPENDED &&
            this.suspensionEndAt != null &&
            LocalDateTime.now().isAfter(this.suspensionEndAt)) {
            this.status = UserStatus.ACTIVE;
            this.suspensionEndAt = null;
            return true;
        }
        return false;
    }
}