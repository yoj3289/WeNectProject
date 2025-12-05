package com.wenect.donation_paltform.domain.report.controller;

import com.wenect.donation_paltform.domain.report.dto.CreateReportRequest;
import com.wenect.donation_paltform.domain.report.dto.ReportResponse;
import com.wenect.donation_paltform.domain.report.service.ReportService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.common.PageResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 신고 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateReportRequest request
    ) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtTokenProvider.getUserId(token);

            ReportResponse response = reportService.createReport(userId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "신고가 접수되었습니다."));
        } catch (IllegalArgumentException e) {
            log.warn("신고 생성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "REPORT_ERROR"));
        } catch (Exception e) {
            log.error("신고 생성 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 접수 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }

    /**
     * 신고 상세 조회
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long reportId
    ) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtTokenProvider.getUserId(token);

            ReportResponse response = reportService.getReport(reportId);

            // 본인의 신고만 조회 가능
            if (!response.getUserId().equals(userId)) {
                return ResponseEntity.status(403)
                        .body(ApiResponse.error("본인의 신고만 조회할 수 있습니다.", "FORBIDDEN"));
            }

            return ResponseEntity.ok(ApiResponse.success(response, "신고 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "NOT_FOUND"));
        } catch (Exception e) {
            log.error("신고 조회 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 조회 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }

    /**
     * 내 신고 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<ReportResponse>>> getMyReports(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtTokenProvider.getUserId(token);

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            PageResponse<ReportResponse> response = reportService.getMyReports(userId, pageable);

            return ResponseEntity.ok(ApiResponse.success(response, "내 신고 목록 조회 성공"));
        } catch (Exception e) {
            log.error("신고 목록 조회 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 목록 조회 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }

    /**
     * 신고 삭제 (본인의 대기 중인 신고만)
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long reportId
    ) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtTokenProvider.getUserId(token);

            reportService.deleteReport(reportId, userId);
            return ResponseEntity.ok(ApiResponse.success(null, "신고가 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "DELETE_ERROR"));
        } catch (Exception e) {
            log.error("신고 삭제 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 삭제 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }
}
