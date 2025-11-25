package com.wenect.donation_paltform.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 토스페이먼츠 결제 준비 응답 DTO (프론트엔드로 전달)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TossPayReadyResponse {
    private String orderId;       // 주문 ID
    private String clientKey;     // 클라이언트 키
    private Integer amount;       // 결제 금액
    private String orderName;     // 주문명
    private String customerKey;   // 고객 키 (브랜드페이용)
    private String successUrl;    // 성공 URL
    private String failUrl;       // 실패 URL
}
