package com.wenect.donation_paltform.domain.donation.dto;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 기부 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationRequest {

    private Long projectId;          // 프로젝트 ID
    private BigDecimal amount;       // 기부 금액
    private String donorName;        // 기부자 이름
    private String donorEmail;       // 기부자 이메일
    private String donorPhone;       // 기부자 전화번호
    private Boolean isAnonymous;     // 익명 기부 여부
    private String message;          // 기부 메시지
    private Donation.PaymentMethod paymentMethod;  // 결제 수단 (KAKAO_PAY, TOSS_PAY)
}
