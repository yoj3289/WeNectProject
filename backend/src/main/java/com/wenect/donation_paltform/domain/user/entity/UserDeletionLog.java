package com.wenect.donation_paltform.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 회원 탈퇴 로그
 * - 사용자가 직접 탈퇴했다는 증거 기록
 * - 법적 분쟁 시 증거자료로 활용
 */
@Entity
@Table(name = "user_deletion_logs")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    /**
     * 탈퇴한 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 탈퇴 당시 이메일 (증거용)
     */
    @Column(name = "email", nullable = false, length = 100)
    private String email;

    /**
     * 탈퇴 당시 사용자명 (증거용)
     */
    @Column(name = "user_name", nullable = false, length = 50)
    private String userName;

    /**
     * 탈퇴 사유
     */
    @Column(name = "delete_reason", length = 500)
    private String deleteReason;

    /**
     * 탈퇴 요청 시간
     */
    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt;

    /**
     * IP 주소 (증거용)
     */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /**
     * User Agent (브라우저 정보, 증거용)
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * 완전 삭제 예정일 (deletedAt + 30일)
     */
    @Column(name = "scheduled_deletion_date", nullable = false)
    private LocalDateTime scheduledDeletionDate;

    /**
     * 실제 삭제 여부
     */
    @Column(name = "is_permanently_deleted")
    @Builder.Default
    private Boolean isPermanentlyDeleted = false;

    /**
     * 실제 삭제 시간
     */
    @Column(name = "permanently_deleted_at")
    private LocalDateTime permanentlyDeletedAt;
}
