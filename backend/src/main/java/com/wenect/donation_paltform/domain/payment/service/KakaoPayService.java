package com.wenect.donation_paltform.domain.payment.service;

import com.wenect.donation_paltform.domain.payment.dto.*;
import com.wenect.donation_paltform.global.config.properties.KakaoPayProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 카카오페이 결제 서비스
 *
 * 블로그 참고: https://myste-leee.tistory.com/272
 * 중요: MultiValueMap 대신 Map 사용 (블로그 주의사항)
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
    public KakaoPayReadyResponse readyPayment(String itemName, int totalAmount, String userId, String orderId, Long projectId) {
        log.info("카카오페이 결제 준비 요청 - 상품: {}, 금액: {}, orderId: {}, projectId: {}", itemName, totalAmount, orderId, projectId);

        // 블로그 권장: Map 사용 (MultiValueMap 사용 시 대괄호[] 문제 발생)
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("cid", kakaoPayProperties.getCid());
        parameters.put("partner_order_id", orderId);
        parameters.put("partner_user_id", userId);
        parameters.put("item_name", itemName);
        parameters.put("quantity", 1);
        parameters.put("total_amount", totalAmount);
        parameters.put("tax_free_amount", 0);
        parameters.put("approval_url", kakaoPayProperties.getApprovalUrl() + "?orderId=" + orderId + "&projectId=" + projectId);
        parameters.put("cancel_url", kakaoPayProperties.getCancelUrl() + "?orderId=" + orderId + "&projectId=" + projectId);
        parameters.put("fail_url", kakaoPayProperties.getFailUrl() + "?orderId=" + orderId + "&projectId=" + projectId);

        log.info("카카오페이 요청 파라미터: {}", parameters);

        // HTTP 헤더 설정 (중요: SECRET_KEY 앞에 공백 필요)
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "SECRET_KEY " + kakaoPayProperties.getSecretKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // HTTP 요청 엔티티 생성
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(parameters, headers);

        // RestTemplate으로 API 호출
        try {
            KakaoPayReadyResponse response = restTemplate.postForObject(
                    kakaoPayProperties.getReadyUrl(),
                    entity,
                    KakaoPayReadyResponse.class
            );

            log.info("카카오페이 결제 준비 완료 - TID: {}", response.getTid());
            return response;
        } catch (Exception e) {
            log.error("카카오페이 결제 준비 실패", e);
            throw new RuntimeException("카카오페이 결제 준비 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 2단계: 결제 승인 (Approve)
     * 사용자가 결제를 완료한 후 pg_token을 받아 최종 승인
     */
    public KakaoPayApproveResponse approvePayment(String tid, String pgToken, String userId, String orderId) {
        log.info("카카오페이 결제 승인 요청 - TID: {}, pgToken: {}, orderId: {}", tid, pgToken, orderId);

        // 블로그 권장: Map 사용
        Map<String, String> parameters = new HashMap<>();
        parameters.put("cid", kakaoPayProperties.getCid());
        parameters.put("tid", tid);
        parameters.put("partner_order_id", orderId);
        parameters.put("partner_user_id", userId);
        parameters.put("pg_token", pgToken);

        log.info("카카오페이 승인 파라미터: {}", parameters);

        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "SECRET_KEY " + kakaoPayProperties.getSecretKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // HTTP 요청 엔티티 생성
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(parameters, headers);

        // RestTemplate으로 API 호출
        try {
            KakaoPayApproveResponse response = restTemplate.postForObject(
                    kakaoPayProperties.getApproveUrl(),
                    entity,
                    KakaoPayApproveResponse.class
            );

            log.info("카카오페이 결제 승인 완료 - AID: {}, 금액: {}", response.getAid(), response.getAmount().getTotal());
            return response;
        } catch (Exception e) {
            log.error("카카오페이 결제 승인 실패", e);
            throw new RuntimeException("카카오페이 결제 승인 실패: " + e.getMessage(), e);
        }
    }
}
