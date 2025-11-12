package com.wenect.donation_paltform.domain.donation.dto;

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
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;

    /**
     * Entity를 DTO로 변환
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
                .approvedAt(donation.getApprovedAt())
                .createdAt(donation.getCreatedAt())
                .build();
    }
}
