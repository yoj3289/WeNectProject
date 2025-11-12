package com.wenect.donation_paltform.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 카카오페이 결제 준비 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KakaoPayReadyRequest {

    private String cid;                 // 가맹점 코드
    private String partner_order_id;    // 가맹점 주문번호
    private String partner_user_id;     // 가맹점 회원 id
    private String item_name;           // 상품명
    private Integer quantity;           // 상품 수량
    private Integer total_amount;       // 상품 총액
    private Integer tax_free_amount;    // 상품 비과세 금액
    private String approval_url;        // 결제 성공 시 redirect url
    private String cancel_url;          // 결제 취소 시 redirect url
    private String fail_url;            // 결제 실패 시 redirect url
}
