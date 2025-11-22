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
        ACTIVE,     // 정상
        INACTIVE,   // 비활성
        SUSPENDED,  // 정지
        DELETED     // 탈퇴 (30일간 유예)
    }
}