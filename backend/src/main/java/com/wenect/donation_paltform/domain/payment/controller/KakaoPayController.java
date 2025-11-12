package com.wenect.donation_paltform.domain.payment.controller;

import com.wenect.donation_paltform.domain.payment.dto.KakaoPayApproveResponse;
import com.wenect.donation_paltform.domain.payment.dto.KakaoPayReadyResponse;
import com.wenect.donation_paltform.domain.payment.service.KakaoPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 카카오페이 결제 컨트롤러
 */
@RestController
@RequestMapping("/api/payments/kakao")
@RequiredArgsConstructor
@Slf4j
public class KakaoPayController {

    private final KakaoPayService kakaoPayService;

    /**
     * 결제 준비 API
     *
     * @param itemName 상품명
     * @param totalAmount 결제 금액
     * @param userId 사용자 ID
     * @param orderId 주문 ID
     * @return 결제 URL 정보
     */
    @PostMapping("/ready")
    public ResponseEntity<KakaoPayReadyResponse> readyPayment(
            @RequestParam String itemName,
            @RequestParam int totalAmount,
            @RequestParam String userId,
            @RequestParam String orderId) {

        try {
            KakaoPayReadyResponse response = kakaoPayService.readyPayment(
                    itemName, totalAmount, userId, orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("결제 준비 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 결제 성공 콜백
     * 카카오페이에서 pg_token과 함께 리다이렉트
     *
     * @param pgToken 결제 승인 토큰
     * @param orderId 주문 ID
     */
    @GetMapping("/success")
    public ResponseEntity<KakaoPayApproveResponse> successPayment(
            @RequestParam("pg_token") String pgToken,
            @RequestParam("orderId") String orderId) {

        try {
            // TODO: orderId로 저장된 tid와 userId 조회 필요
            String tid = "조회된 TID";
            String userId = "조회된 UserId";

            KakaoPayApproveResponse response = kakaoPayService.approvePayment(
                    tid, pgToken, userId, orderId);

            // TODO: 결제 완료 처리 (DB 저장 등)

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("결제 승인 실패", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 결제 취소 콜백
     */
    @GetMapping("/cancel")
    public ResponseEntity<String> cancelPayment() {
        log.info("결제 취소됨");
        return ResponseEntity.ok("결제가 취소되었습니다.");
    }

    /**
     * 결제 실패 콜백
     */
    @GetMapping("/fail")
    public ResponseEntity<String> failPayment() {
        log.error("결제 실패");
        return ResponseEntity.ok("결제에 실패했습니다.");
    }
}
