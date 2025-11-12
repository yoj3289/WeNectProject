package com.wenect.donation_paltform.domain.payment.service;

import com.wenect.donation_paltform.domain.payment.dto.*;
import com.wenect.donation_paltform.global.config.properties.KakaoPayProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * 카카오페이 결제 서비스
 *
 * 블로그 참고: https://myste-leee.tistory.com/272
 * 중요: MultiValueMap 대신 일반 객체 사용 (블로그 주의사항)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoPayService {

    private final KakaoPayProperties kakaoPayProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 1단계: 결제 준비 (Ready)
     * 사용자에게 결제 URL을 제공
     */
    public KakaoPayReadyResponse readyPayment(String itemName, int totalAmount, String userId, String orderId) {
        log.info("카카오페이 결제 준비 요청 - 상품: {}, 금액: {}", itemName, totalAmount);

        // 요청 객체 생성
        KakaoPayReadyRequest request = KakaoPayReadyRequest.builder()
                .cid(kakaoPayProperties.getCid())
                .partner_order_id(orderId)
                .partner_user_id(userId)
                .item_name(itemName)
                .quantity(1)
                .total_amount(totalAmount)
                .tax_free_amount(0)
                .approval_url(kakaoPayProperties.getApprovalUrl() + "?orderId=" + orderId)
                .cancel_url(kakaoPayProperties.getCancelUrl())
                .fail_url(kakaoPayProperties.getFailUrl())
                .build();

        // HTTP 헤더 설정 (중요: SECRET_KEY 앞에 공백 필요)
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "SECRET_KEY " + kakaoPayProperties.getSecretKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // HTTP 요청 엔티티 생성
        HttpEntity<KakaoPayReadyRequest> entity = new HttpEntity<>(request, headers);

        // RestTemplate으로 API 호출
        ResponseEntity<KakaoPayReadyResponse> responseEntity = restTemplate.postForEntity(
                kakaoPayProperties.getReadyUrl(),
                entity,
                KakaoPayReadyResponse.class
        );

        KakaoPayReadyResponse response = responseEntity.getBody();
        log.info("카카오페이 결제 준비 완료 - TID: {}", response.getTid());
        return response;
    }

    /**
     * 2단계: 결제 승인 (Approve)
     * 사용자가 결제를 완료한 후 pg_token을 받아 최종 승인
     */
    public KakaoPayApproveResponse approvePayment(String tid, String pgToken, String userId, String orderId) {
        log.info("카카오페이 결제 승인 요청 - TID: {}, pgToken: {}", tid, pgToken);

        // 요청 객체 생성
        KakaoPayApproveRequest request = KakaoPayApproveRequest.builder()
                .cid(kakaoPayProperties.getCid())
                .tid(tid)
                .partner_order_id(orderId)
                .partner_user_id(userId)
                .pg_token(pgToken)
                .build();

        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "SECRET_KEY " + kakaoPayProperties.getSecretKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // HTTP 요청 엔티티 생성
        HttpEntity<KakaoPayApproveRequest> entity = new HttpEntity<>(request, headers);

        // RestTemplate으로 API 호출
        ResponseEntity<KakaoPayApproveResponse> responseEntity = restTemplate.postForEntity(
                kakaoPayProperties.getApproveUrl(),
                entity,
                KakaoPayApproveResponse.class
        );

        KakaoPayApproveResponse response = responseEntity.getBody();
        log.info("카카오페이 결제 승인 완료 - AID: {}, 금액: {}", response.getAid(), response.getAmount().getTotal());
        return response;
    }
}
