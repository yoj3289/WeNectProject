package com.wenect.donation_paltform.domain.payment.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 카카오페이 결제 준비 응답 DTO
 */
@Getter
@Setter
public class KakaoPayReadyResponse {

    private String tid;                          // 결제 고유 번호
    private String next_redirect_app_url;        // 모바일 앱 결제 페이지
    private String next_redirect_mobile_url;     // 모바일 웹 결제 페이지
    private String next_redirect_pc_url;         // PC 웹 결제 페이지
    private String android_app_scheme;           // 안드로이드 앱 스킴
    private String ios_app_scheme;               // iOS 앱 스킴
    private String created_at;                   // 결제 준비 요청 시간
}
