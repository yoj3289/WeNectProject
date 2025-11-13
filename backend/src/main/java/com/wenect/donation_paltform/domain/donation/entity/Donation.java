package com.wenect.donation_paltform.domain.donation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 기부 내역 엔티티
 */
@Entity
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "donation_id")
    private Long donationId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "user_id")
    private Long userId;  // 비회원 기부 가능하므로 nullable

    @Column(name = "payment_id")
    private Long paymentId;  // 결제 정보 ID (payments 테이블 참조)

    @Column(name = "selected_option_id")
    private Long selectedOptionId;  // 선택한 기부 옵션 ID (donation_options 테이블 참조)

    @Column(name = "donor_name", nullable = false, length = 100)
    private String donorName;  // 기부자 이름

    @Column(name = "donor_email", length = 100)
    private String donorEmail;  // 기부자 이메일 (영수증 발급용)

    @Column(name = "donor_phone", length = 20)
    private String donorPhone;  // 기부자 전화번호

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;  // 기부 금액

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;  // 결제 수단

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DonationStatus status = DonationStatus.PENDING;  // 기부 상태

    // 카카오페이 관련 정보
    @Column(name = "payment_tid", length = 100)
    private String paymentTid;  // 카카오페이 거래 ID

    @Column(name = "payment_aid", length = 100)
    private String paymentAid;  // 카카오페이 승인 ID

    @Column(name = "order_id", unique = true, nullable = false, length = 100)
    private String orderId;  // 주문 ID (결제 준비 시 생성)

    @Column(name = "payment_method_type", length = 20)
    private String paymentMethodType;  // 실제 결제 수단 (MONEY, CARD 등)

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;  // 결제 승인 시간

    @Column(name = "donated_at", nullable = false, updatable = false)
    private LocalDateTime donatedAt;  // 기부 시간

    // DB의 anonymous 필드는 레거시 필드이므로 무시 (is_anonymous 사용)
    @Column(name = "anonymous", insertable = false, updatable = false)
    private Boolean anonymous;  // 레거시 필드 (읽기 전용)

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private Boolean isAnonymous = false;  // 익명 기부 여부

    @Column(columnDefinition = "TEXT")
    private String message;  // 기부 메시지

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        donatedAt = now;  // 기부 시간 자동 설정
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 결제 수단
     */
    public enum PaymentMethod {
        KAKAO_PAY,  // 카카오페이
        TOSS_PAY    // 토스페이 (향후 추가)
    }

    /**
     * 기부 상태
     */
    public enum DonationStatus {
        PENDING,    // 결제 대기
        COMPLETED,  // 결제 완료
        CANCELLED,  // 결제 취소
        FAILED,     // 결제 실패
        REFUNDED    // 환불
    }
}
