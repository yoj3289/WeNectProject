package com.wenect.donation_paltform.domain.donation.controller;

import com.wenect.donation_paltform.domain.donation.dto.DonationResponse;
import com.wenect.donation_paltform.domain.donation.dto.FeaturedMessageResponse;
import com.wenect.donation_paltform.domain.donation.service.DonationService;
import com.wenect.donation_paltform.global.common.PageResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 내 기부 내역 조회 (JWT 토큰 기반) - 페이지네이션 지원
     *
     * @param year 연도 필터 (선택, 예: 2024)
     * @param status 상태 필터 (선택, all/completed/pending/cancelled/failed)
     * @param page 페이지 번호 (0부터 시작, 기본값: 0)
     * @param size 페이지 크기 (기본값: 10)
     */
    @GetMapping("/my")
    public ResponseEntity<PageResponse<DonationResponse>> getMyDonations(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Long userId = getUserIdFromToken(authHeader);
        log.info("내 기부 내역 조회 요청 - userId: {}, year: {}, status: {}, page: {}, size: {}",
                userId, year, status, page, size);
        PageResponse<DonationResponse> donations = donationService.getDonationsByUserIdPaged(userId, year, status, page, size);
        return ResponseEntity.ok(donations);
    }

    /**
     * 내 기부 통계 조회 (JWT 토큰 기반)
     * 총 기부금액, 총 기부횟수, 완료된 기부횟수
     */
    @GetMapping("/my/stats")
    public ResponseEntity<DonationService.UserDonationStats> getMyDonationStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getUserIdFromToken(authHeader);
        log.info("내 기부 통계 조회 요청 - userId: {}", userId);
        DonationService.UserDonationStats stats = donationService.getUserDonationStats(userId);
        return ResponseEntity.ok(stats);
    }

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

    // ==================== Featured Messages (홈페이지 노출용) ====================

    /**
     * 홈페이지 후기 섹션용 Featured 응원 메시지 조회 (공개 API)
     * 하이브리드 방식: 관리자 선정 메시지 우선 + 부족하면 최근 메시지로 자동 보충
     */
    @GetMapping("/featured")
    public ResponseEntity<List<FeaturedMessageResponse>> getFeaturedMessages(
            @RequestParam(value = "limit", defaultValue = "3") int limit) {
        log.info("홈페이지 Featured 메시지 조회 요청 - limit: {}", limit);
        List<FeaturedMessageResponse> messages = donationService.getFeaturedMessages(limit);
        return ResponseEntity.ok(messages);
    }

    /**
     * 기부 메시지의 Featured 상태 토글 (관리자용)
     */
    @PatchMapping("/{donationId}/featured")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> toggleFeatured(
            @PathVariable Long donationId,
            @RequestParam boolean isFeatured) {
        log.info("Featured 상태 토글 요청 - donationId: {}, isFeatured: {}", donationId, isFeatured);
        try {
            donationService.toggleFeatured(donationId, isFeatured);
            return ResponseEntity.ok(isFeatured ? "홈페이지 노출로 설정되었습니다." : "홈페이지 노출이 해제되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== 관리자용 전체 기부 조회 ====================

    /**
     * 관리자용 전체 기부 내역 조회 (필터 지원)
     *
     * @param status 상태 필터 (all/completed/pending/cancelled/failed)
     * @param hasMessage 메시지 유무 필터 (true/false)
     * @param isFeatured Featured 필터 (true/false)
     * @param period 기간 필터 (week/month/3months/all)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기 (기본값: 20)
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<DonationResponse>> getAllDonationsForAdmin(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "hasMessage", required = false) Boolean hasMessage,
            @RequestParam(value = "isFeatured", required = false) Boolean isFeatured,
            @RequestParam(value = "period", required = false, defaultValue = "all") String period,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        log.info("관리자 전체 기부 조회 요청 - status: {}, hasMessage: {}, isFeatured: {}, period: {}, page: {}, size: {}",
                status, hasMessage, isFeatured, period, page, size);
        PageResponse<DonationResponse> donations = donationService.getAllDonationsForAdmin(
                status, hasMessage, isFeatured, period, page, size);
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

    /**
     * 100% 달성 프로젝트 일괄 완료 처리 (임시 마이그레이션용 - 사용 후 삭제)
     * 관리자만 실행 가능
     */
    @PostMapping("/migrate-funded-projects")
    public ResponseEntity<MigrationResult> migrateFundedProjects() {
        log.info("=== 100% 달성 프로젝트 일괄 완료 처리 시작 ===");
        MigrationResult result = donationService.migrateFundedProjects();
        log.info("=== 완료: {}개, 저금통: {}개 ===", result.completedProjectCount(), result.piggyBankCreatedCount());
        return ResponseEntity.ok(result);
    }

    /**
     * 마이그레이션 결과 DTO (임시 - 사용 후 삭제)
     */
    public record MigrationResult(
            int completedProjectCount,
            int piggyBankCreatedCount,
            java.util.List<Long> completedProjectIds
    ) {}

    /**
     * JWT 토큰에서 userId 추출
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }

        String token = authHeader.substring(7); // "Bearer " 제거
        return jwtTokenProvider.getUserId(token);
    }
}
