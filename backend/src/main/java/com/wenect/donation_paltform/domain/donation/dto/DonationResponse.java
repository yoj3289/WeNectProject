package com.wenect.donation_paltform.domain.donation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 기부 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponse {

    private Long donationId;
    private Long projectId;
    private String projectTitle;      // 프로젝트 제목 (조인 시 추가)
    private String organizationName;  // 기관명 (조인 시 추가)
    private Long userId;
    private String donorName;
    private String donorEmail;
    private BigDecimal amount;
    private Donation.PaymentMethod paymentMethod;
    private Donation.DonationStatus status;
    private String orderId;
    private String paymentTid;
    private String paymentAid;
    private String paymentMethodType;
    private Boolean isAnonymous;
    private String message;
    private Boolean isFeatured;  // 홈페이지 노출 여부
    private LocalDateTime donatedAt;   // 기부일 (결제 시작 시간)
    private LocalDateTime approvedAt;  // 결제 완료 시간
    private LocalDateTime createdAt;

    // 프론트엔드 호환성: timestamp로도 노출
    @JsonProperty("timestamp")
    public LocalDateTime getTimestamp() {
        return createdAt;
    }

    /**
     * Entity를 DTO로 변환 (프로젝트 정보 없이)
     */
    public static DonationResponse from(Donation donation) {
        return DonationResponse.builder()
                .donationId(donation.getDonationId())
                .projectId(donation.getProjectId())
                .userId(donation.getUserId())
                .donorName(donation.getIsAnonymous() ? "익명" : donation.getDonorName())
                .donorEmail(donation.getDonorEmail())
                .amount(donation.getAmount())
                .paymentMethod(donation.getPaymentMethod())
                .status(donation.getStatus())
                .orderId(donation.getOrderId())
                .paymentTid(donation.getPaymentTid())
                .paymentAid(donation.getPaymentAid())
                .paymentMethodType(donation.getPaymentMethodType())
                .isAnonymous(donation.getIsAnonymous())
                .message(donation.getMessage())
                .isFeatured(donation.getIsFeatured())
                .donatedAt(donation.getDonatedAt())
                .approvedAt(donation.getApprovedAt())
                .createdAt(donation.getCreatedAt())
                .build();
    }

    /**
     * Entity를 DTO로 변환 (프로젝트 정보 포함)
     */
    public static DonationResponse from(Donation donation, String projectTitle, String organizationName) {
        return DonationResponse.builder()
                .donationId(donation.getDonationId())
                .projectId(donation.getProjectId())
                .projectTitle(projectTitle)
                .organizationName(organizationName)
                .userId(donation.getUserId())
                .donorName(donation.getIsAnonymous() ? "익명" : donation.getDonorName())
                .donorEmail(donation.getDonorEmail())
                .amount(donation.getAmount())
                .paymentMethod(donation.getPaymentMethod())
                .status(donation.getStatus())
                .orderId(donation.getOrderId())
                .paymentTid(donation.getPaymentTid())
                .paymentAid(donation.getPaymentAid())
                .paymentMethodType(donation.getPaymentMethodType())
                .isAnonymous(donation.getIsAnonymous())
                .message(donation.getMessage())
                .isFeatured(donation.getIsFeatured())
                .donatedAt(donation.getDonatedAt())
                .approvedAt(donation.getApprovedAt())
                .createdAt(donation.getCreatedAt())
                .build();
    }
}
