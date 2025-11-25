package com.wenect.donation_paltform.domain.payment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 토스페이먼츠 결제 승인 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TossPayConfirmResponse {
    private String mId;                   // 가맹점 ID
    private String version;               // API 버전
    private String paymentKey;            // 결제 키
    private String orderId;               // 주문 ID
    private String orderName;             // 주문명
    private String currency;              // 통화
    private String method;                // 결제 수단
    private String status;                // 결제 상태
    private String requestedAt;           // 결제 요청 시간
    private String approvedAt;            // 결제 승인 시간
    private Integer totalAmount;          // 총 결제 금액
    private Integer balanceAmount;        // 잔액
    private Integer suppliedAmount;       // 공급가액
    private Integer vat;                  // 부가세
    private String type;                  // 결제 타입
    private String country;               // 국가
    private Boolean isPartialCancelable;  // 부분 취소 가능 여부
    private Receipt receipt;              // 영수증 정보
    private Card card;                    // 카드 정보

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Receipt {
        private String url;               // 영수증 URL
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Card {
        private String company;           // 카드사
        private String number;            // 카드 번호
        private Integer installmentPlanMonths; // 할부 개월
        private Boolean isInterestFree;   // 무이자 여부
        private String approveNo;         // 승인 번호
        private String acquirerCode;      // 매입사 코드
        private String cardType;          // 카드 타입
        private String ownerType;         // 소유자 타입
    }
}
