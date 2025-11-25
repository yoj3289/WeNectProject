package com.wenect.donation_paltform.domain.payment.service;

import com.wenect.donation_paltform.domain.payment.dto.TossPayConfirmRequest;
import com.wenect.donation_paltform.domain.payment.dto.TossPayConfirmResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 토스페이먼츠 브랜드페이 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TossPayService {

    @Value("${tosspay.client-key}")
    private String clientKey;

    @Value("${tosspay.secret-key}")
    private String secretKey;

    @Value("${tosspay.confirm-url}")
    private String confirmUrl;

    @Value("${tosspay.success-url}")
    private String successUrl;

    @Value("${tosspay.fail-url}")
    private String failUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 클라이언트 키 반환 (프론트엔드에서 사용)
     */
    public String getClientKey() {
        return clientKey;
    }

    /**
     * 성공 URL 반환
     */
    public String getSuccessUrl() {
        return successUrl;
    }

    /**
     * 실패 URL 반환
     */
    public String getFailUrl() {
        return failUrl;
    }

    /**
     * 결제 승인 (브랜드페이)
     */
    public TossPayConfirmResponse confirmPayment(TossPayConfirmRequest request) {
        log.info("=== 토스페이 결제 승인 요청 ===");
        log.info("paymentKey: {}, orderId: {}, amount: {}",
                request.getPaymentKey(), request.getOrderId(), request.getAmount());

        try {
            // Authorization 헤더 생성 (Basic Auth)
            String credentials = secretKey + ":";
            String encodedCredentials = Base64.getEncoder()
                    .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + encodedCredentials);

            // 요청 바디 생성
            Map<String, Object> body = new HashMap<>();
            body.put("paymentKey", request.getPaymentKey());
            body.put("orderId", request.getOrderId());
            body.put("amount", request.getAmount());

            // 브랜드페이인 경우 customerKey 추가
            if (request.getCustomerKey() != null) {
                body.put("customerKey", request.getCustomerKey());
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            log.info("토스페이 결제 승인 API 호출: {}", confirmUrl);

            // API 호출
            ResponseEntity<TossPayConfirmResponse> response = restTemplate.exchange(
                    confirmUrl,
                    HttpMethod.POST,
                    entity,
                    TossPayConfirmResponse.class
            );

            TossPayConfirmResponse result = response.getBody();
            log.info("토스페이 결제 승인 성공: {}", result);

            return result;

        } catch (Exception e) {
            log.error("토스페이 결제 승인 실패", e);
            throw new RuntimeException("토스페이 결제 승인에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 결제 정보 조회용 설정 반환
     */
    public Map<String, String> getPaymentConfig(String orderId, int amount) {
        Map<String, String> config = new HashMap<>();
        config.put("clientKey", clientKey);
        config.put("successUrl", successUrl + "?orderId=" + orderId);
        config.put("failUrl", failUrl + "?orderId=" + orderId);
        return config;
    }
}
