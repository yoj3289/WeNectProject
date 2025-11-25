package com.wenect.donation_paltform.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 토스페이먼츠 결제 승인 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TossPayConfirmRequest {
    private String paymentKey;    // 토스에서 발급한 결제 키
    private String orderId;       // 주문 ID
    private Integer amount;       // 결제 금액
    private String customerKey;   // 브랜드페이 고객 키 (선택)
}
