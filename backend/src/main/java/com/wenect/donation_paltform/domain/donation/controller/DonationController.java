package com.wenect.donation_paltform.domain.donation.controller;

import com.wenect.donation_paltform.domain.donation.dto.DonationResponse;
import com.wenect.donation_paltform.domain.donation.service.DonationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 기부 관련 컨트롤러
 */
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class DonationController {

    private final DonationService donationService;

    /**
     * 프로젝트별 기부 내역 목록 조회
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DonationResponse>> getDonationsByProjectId(@PathVariable Long projectId) {
        log.info("프로젝트별 기부 내역 조회 요청 - projectId: {}", projectId);
        List<DonationResponse> donations = donationService.getDonationsByProjectId(projectId);
        return ResponseEntity.ok(donations);
    }

    /**
     * 사용자별 기부 내역 목록 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DonationResponse>> getDonationsByUserId(@PathVariable Long userId) {
        log.info("사용자별 기부 내역 조회 요청 - userId: {}", userId);
        List<DonationResponse> donations = donationService.getDonationsByUserId(userId);
        return ResponseEntity.ok(donations);
    }

    /**
     * 주문 ID로 기부 내역 조회
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<DonationResponse> getDonationByOrderId(@PathVariable String orderId) {
        log.info("주문 ID로 기부 내역 조회 요청 - orderId: {}", orderId);
        DonationResponse donation = DonationResponse.from(donationService.getDonationByOrderId(orderId));
        return ResponseEntity.ok(donation);
    }

    /**
     * 최근 기부 내역 조회
     */
    @GetMapping("/recent")
    public ResponseEntity<List<DonationResponse>> getRecentDonations(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        log.info("최근 기부 내역 조회 요청 - limit: {}", limit);
        List<DonationResponse> donations = donationService.getRecentDonations(limit);
        return ResponseEntity.ok(donations);
    }

    /**
     * 프로젝트 통계 재계산 (관리자용 / 데이터 불일치 해결)
     */
    @PostMapping("/project/{projectId}/recalculate")
    public ResponseEntity<String> recalculateProjectStats(@PathVariable Long projectId) {
        log.info("프로젝트 통계 재계산 요청 - projectId: {}", projectId);
        try {
            donationService.recalculateProjectStats(projectId);
            return ResponseEntity.ok("프로젝트 통계가 재계산되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
