package com.wenect.donation_paltform.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 카카오페이 결제 승인 요청 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KakaoPayApproveRequest {

    private String cid;                 // 가맹점 코드
    private String tid;                 // 결제 고유 번호
    private String partner_order_id;    // 가맹점 주문번호
    private String partner_user_id;     // 가맹점 회원 id
    private String pg_token;            // 결제승인 요청을 인증하는 토큰
}
