package com.wenect.donation_paltform.domain.payment.controller;

import com.wenect.donation_paltform.domain.donation.dto.DonationRequest;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.service.DonationService;
import com.wenect.donation_paltform.domain.payment.dto.KakaoPayApproveResponse;
import com.wenect.donation_paltform.domain.payment.dto.KakaoPayReadyResponse;
import com.wenect.donation_paltform.domain.payment.service.KakaoPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 카카오페이 결제 컨트롤러 (기부 연동)
 */
@RestController
@RequestMapping("/api/payments/kakao")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class KakaoPayController {

    private final KakaoPayService kakaoPayService;
    private final DonationService donationService;

    // TID를 임시로 저장할 맵 (실제로는 Redis 등 사용 권장)
    private final Map<String, String> tidStorage = new HashMap<>();

    /**
     * 결제 준비 API - 기부 내역 생성 및 카카오페이 결제 준비
     *
     * @param donationRequest 기부 요청 정보
     * @return 결제 URL 정보
     */
    @PostMapping("/ready")
    public ResponseEntity<?> readyPayment(@RequestBody DonationRequest donationRequest) {
        try {
            log.info("=== 기부 결제 준비 요청 시작 ===");
            log.info("요청 데이터: {}", donationRequest);
            log.info("projectId: {}, amount: {}, donorName: {}, paymentMethod: {}",
                    donationRequest.getProjectId(),
                    donationRequest.getAmount(),
                    donationRequest.getDonorName(),
                    donationRequest.getPaymentMethod());

            // 1. 기부 내역 생성 (PENDING 상태)
            log.info("1. 기부 내역 생성 중...");
            Donation donation = donationService.createDonation(donationRequest, null);
            log.info("기부 내역 생성 완료 - donationId: {}", donation.getDonationId());
            String orderId = donation.getOrderId();
            // orderId를 partner_user_id로 사용 (준비/승인 시 동일해야 함)
            String userId = orderId;

            // 2. 카카오페이 결제 준비
            log.info("2. 카카오페이 결제 준비 중...");
            String itemName = "기부 - 프로젝트 #" + donationRequest.getProjectId();
            int totalAmount = donationRequest.getAmount().intValue();
            log.info("itemName: {}, totalAmount: {}, userId: {}, orderId: {}",
                    itemName, totalAmount, userId, orderId);

            KakaoPayReadyResponse response = kakaoPayService.readyPayment(
                    itemName, totalAmount, userId, orderId);

            // 3. TID를 DB에 저장 (메모리 대신 DB 사용으로 재시작 후에도 유지)
            donation.setPaymentTid(response.getTid());
            donationService.saveDonation(donation);

            log.info("=== 기부 결제 준비 완료 - orderId: {}, tid: {} ===", orderId, response.getTid());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("=== 결제 준비 실패 ===", e);
            log.error("에러 메시지: {}", e.getMessage());
            log.error("에러 타입: {}", e.getClass().getName());
            if (e.getCause() != null) {
                log.error("원인: {}", e.getCause().getMessage());
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "알 수 없는 오류",
                    "type", e.getClass().getSimpleName()
            ));
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
    public ResponseEntity<?> successPayment(
            @RequestParam("pg_token") String pgToken,
            @RequestParam("orderId") String orderId) {
        try {
            log.info("결제 성공 콜백 - orderId: {}, pgToken: {}", orderId, pgToken);

            // 1. 기부 내역 조회 (DB에서 TID 가져오기)
            Donation donation = donationService.getDonationByOrderId(orderId);

            // 2. 이미 완료된 결제인지 확인 (중복 승인 방지)
            if (donation.getStatus() == Donation.DonationStatus.COMPLETED) {
                log.info("이미 완료된 결제입니다 - orderId: {}", orderId);
                // 이미 완료된 결제는 성공 응답 반환 (페이지 새로고침 대응)
                return ResponseEntity.ok(Map.of(
                    "status", "already_completed",
                    "message", "결제가 이미 완료되었습니다.",
                    "orderId", orderId
                ));
            }

            String tid = donation.getPaymentTid();
            if (tid == null) {
                throw new IllegalArgumentException("결제 정보를 찾을 수 없습니다. TID가 저장되지 않았습니다.");
            }

            // 3. orderId를 partner_user_id로 사용 (준비 시와 동일해야 함)
            String userId = orderId;

            // 4. 카카오페이 결제 승인
            KakaoPayApproveResponse response = kakaoPayService.approvePayment(
                    tid, pgToken, userId, orderId);

            // 5. 기부 내역 업데이트 (COMPLETED 상태로 변경 및 프로젝트 통계 업데이트)
            donationService.approveDonation(
                    orderId,
                    response.getTid(),
                    response.getAid(),
                    response.getPayment_method_type()
            );

            log.info("기부 결제 승인 완료 - orderId: {}, amount: {}", orderId, response.getAmount().getTotal());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("결제 승인 실패", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 결제 취소 콜백
     */
    @GetMapping("/cancel")
    public ResponseEntity<String> cancelPayment(@RequestParam("orderId") String orderId) {
        try {
            log.info("결제 취소 - orderId: {}", orderId);

            // 기부 내역 취소 처리
            donationService.cancelDonation(orderId);

            return ResponseEntity.ok("결제가 취소되었습니다.");
        } catch (Exception e) {
            log.error("결제 취소 처리 실패", e);
            return ResponseEntity.ok("결제가 취소되었습니다.");
        }
    }

    /**
     * 결제 실패 콜백
     */
    @GetMapping("/fail")
    public ResponseEntity<String> failPayment(@RequestParam("orderId") String orderId) {
        try {
            log.error("결제 실패 - orderId: {}", orderId);

            // 기부 내역 실패 처리
            donationService.failDonation(orderId);

            return ResponseEntity.ok("결제에 실패했습니다.");
        } catch (Exception e) {
            log.error("결제 실패 처리 오류", e);
            return ResponseEntity.ok("결제에 실패했습니다.");
        }
    }
}
