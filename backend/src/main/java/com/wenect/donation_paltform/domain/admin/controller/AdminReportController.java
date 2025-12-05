package com.wenect.donation_paltform.domain.admin.controller;

import com.wenect.donation_paltform.domain.report.dto.ProcessReportRequest;
import com.wenect.donation_paltform.domain.report.dto.ReportResponse;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportStatus;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportType;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 신고 목록 조회 (필터링)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReportResponse>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportType reportType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            PageResponse<ReportResponse> response = reportService.getReports(status, reportType, pageable);

            return ResponseEntity.ok(ApiResponse.success(response, "신고 목록 조회 성공"));
        } catch (Exception e) {
            log.error("신고 목록 조회 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 목록 조회 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }

    /**
     * 신고 상세 조회
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(@PathVariable Long reportId) {
        try {
            ReportResponse response = reportService.getReport(reportId);
            return ResponseEntity.ok(ApiResponse.success(response, "신고 상세 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "NOT_FOUND"));
        } catch (Exception e) {
            log.error("신고 상세 조회 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 조회 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }

    /**
     * 신고 처리 (승인/반려)
     */
    @PutMapping("/{reportId}/process")
    public ResponseEntity<ApiResponse<ReportResponse>> processReport(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long reportId,
            @RequestBody ProcessReportRequest request
    ) {
        try {
            String token = authHeader.substring(7);
            Long adminId = jwtTokenProvider.getUserId(token);

            ReportResponse response = reportService.processReport(reportId, adminId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "신고가 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "PROCESS_ERROR"));
        } catch (Exception e) {
            log.error("신고 처리 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 처리 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }

    /**
     * 신고 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReportStats() {
        try {
            Map<String, Object> stats = reportService.getReportStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "신고 통계 조회 성공"));
        } catch (Exception e) {
            log.error("신고 통계 조회 중 오류", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("신고 통계 조회 중 오류가 발생했습니다.", "INTERNAL_ERROR"));
        }
    }
}
