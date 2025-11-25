package com.wenect.donation_paltform.domain.payment.controller;

import com.wenect.donation_paltform.domain.donation.dto.DonationRequest;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.service.DonationService;
import com.wenect.donation_paltform.domain.payment.dto.TossPayConfirmRequest;
import com.wenect.donation_paltform.domain.payment.dto.TossPayConfirmResponse;
import com.wenect.donation_paltform.domain.payment.dto.TossPayReadyResponse;
import com.wenect.donation_paltform.domain.payment.service.TossPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 토스페이먼츠 브랜드페이 결제 컨트롤러
 */
@RestController
@RequestMapping("/api/payments/toss")
@RequiredArgsConstructor
@Slf4j
public class TossPayController {

    private final TossPayService tossPayService;
    private final DonationService donationService;

    /**
     * 결제 준비 API - 기부 내역 생성 및 결제 정보 반환
     *
     * @param donationRequest 기부 요청 정보
     * @return 결제에 필요한 정보 (clientKey, orderId, amount 등)
     */
    @PostMapping("/ready")
    public ResponseEntity<?> readyPayment(@RequestBody DonationRequest donationRequest) {
        try {
            log.info("=== 토스페이 결제 준비 요청 시작 ===");
            log.info("요청 데이터: {}", donationRequest);

            // 1. 기부 내역 생성 (PENDING 상태)
            Donation donation = donationService.createDonation(donationRequest, null);
            String orderId = donation.getOrderId();
            log.info("기부 내역 생성 완료 - donationId: {}, orderId: {}",
                    donation.getDonationId(), orderId);

            // 2. 고객 키 생성 (브랜드페이용 - 사용자 식별)
            String customerKey = "customer_" + System.currentTimeMillis();

            // 3. 결제 준비 응답 생성
            TossPayReadyResponse response = TossPayReadyResponse.builder()
                    .orderId(orderId)
                    .clientKey(tossPayService.getClientKey())
                    .amount(donationRequest.getAmount().intValue())
                    .orderName("기부 - 프로젝트 #" + donationRequest.getProjectId())
                    .customerKey(customerKey)
                    .successUrl(tossPayService.getSuccessUrl() + "?orderId=" + orderId + "&projectId=" + donationRequest.getProjectId())
                    .failUrl(tossPayService.getFailUrl() + "?orderId=" + orderId)
                    .build();

            log.info("=== 토스페이 결제 준비 완료 - orderId: {} ===", orderId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("토스페이 결제 준비 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "알 수 없는 오류",
                    "type", e.getClass().getSimpleName()
            ));
        }
    }

    /**
     * 결제 승인 API (프론트엔드에서 paymentKey 받아서 호출)
     *
     * @param request 결제 승인 요청 (paymentKey, orderId, amount)
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody TossPayConfirmRequest request) {
        try {
            log.info("=== 토스페이 결제 승인 요청 ===");
            log.info("paymentKey: {}, orderId: {}, amount: {}",
                    request.getPaymentKey(), request.getOrderId(), request.getAmount());

            // 1. 기부 내역 조회
            Donation donation = donationService.getDonationByOrderId(request.getOrderId());

            // 2. 이미 완료된 결제인지 확인
            if (donation.getStatus() == Donation.DonationStatus.COMPLETED) {
                log.info("이미 완료된 결제입니다 - orderId: {}", request.getOrderId());
                return ResponseEntity.ok(Map.of(
                        "status", "already_completed",
                        "message", "결제가 이미 완료되었습니다.",
                        "orderId", request.getOrderId()
                ));
            }

            // 3. 금액 검증
            if (!donation.getAmount().equals(request.getAmount().longValue())) {
                throw new IllegalArgumentException("결제 금액이 일치하지 않습니다.");
            }

            // 4. 토스페이 결제 승인 API 호출
            TossPayConfirmResponse response = tossPayService.confirmPayment(request);

            // 5. 기부 내역 업데이트
            donation.setPaymentTid(response.getPaymentKey());
            donationService.approveDonation(
                    request.getOrderId(),
                    response.getPaymentKey(),
                    response.getOrderId(),
                    "TOSS_BRANDPAY"
            );

            log.info("=== 토스페이 결제 승인 완료 - orderId: {} ===", request.getOrderId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("토스페이 결제 승인 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "결제 승인 실패"
            ));
        }
    }

    /**
     * 결제 실패 처리
     */
    @GetMapping("/fail")
    public ResponseEntity<?> failPayment(
            @RequestParam("orderId") String orderId,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "message", required = false) String message) {
        try {
            log.error("토스페이 결제 실패 - orderId: {}, code: {}, message: {}", orderId, code, message);

            // 기부 내역 실패 처리
            donationService.failDonation(orderId);

            return ResponseEntity.ok(Map.of(
                    "status", "failed",
                    "message", message != null ? message : "결제에 실패했습니다.",
                    "code", code != null ? code : "UNKNOWN"
            ));
        } catch (Exception e) {
            log.error("결제 실패 처리 오류", e);
            return ResponseEntity.ok(Map.of("status", "failed", "message", "결제에 실패했습니다."));
        }
    }

    /**
     * 클라이언트 키 조회 (프론트엔드 SDK 초기화용)
     */
    @GetMapping("/client-key")
    public ResponseEntity<?> getClientKey() {
        return ResponseEntity.ok(Map.of(
                "clientKey", tossPayService.getClientKey()
        ));
    }
}
