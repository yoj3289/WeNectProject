package com.wenect.donation_paltform.domain.settlement.controller;

import com.wenect.donation_paltform.domain.settlement.dto.*;
import com.wenect.donation_paltform.domain.settlement.service.SettlementManagementService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 정산 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/settlement-requests")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class SettlementManagementController {

    private final SettlementManagementService settlementService;

    /**
     * 정산 요청 생성 (기관 사용자)
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> createSettlementRequest(
        @RequestPart("data") SettlementRequestDto requestDto,
        @RequestPart(value = "documents", required = false) List<MultipartFile> documents
    ) {
        try {
            log.info("정산 요청 생성 - projectId: {}", requestDto.getProjectId());
            SettlementResponseDto response = settlementService.createSettlementRequest(requestDto, documents);
            return ResponseEntity.ok(ApiResponse.success(response, "정산 요청이 생성되었습니다."));
        } catch (IOException e) {
            log.error("파일 업로드 실패", e);
            return ResponseEntity.badRequest().body(
                ApiResponse.error("파일 업로드에 실패했습니다.", "FILE_UPLOAD_ERROR")
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("정산 요청 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "SETTLEMENT_REQUEST_ERROR")
            );
        }
    }

    /**
     * 정산 승인 (관리자)
     */
    @PostMapping("/{settlementId}/approve")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> approveSettlement(
        @PathVariable("settlementId") Long settlementId,
        @RequestBody SettlementApproveDto approveDto
    ) {
        try {
            log.info("정산 승인 - settlementId: {}", settlementId);
            SettlementResponseDto response = settlementService.approveSettlement(settlementId, approveDto);
            return ResponseEntity.ok(ApiResponse.success(response, "정산이 승인되었습니다."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("정산 승인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "SETTLEMENT_APPROVE_ERROR")
            );
        }
    }

    /**
     * 정산 반려 (관리자)
     */
    @PostMapping("/{settlementId}/reject")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> rejectSettlement(
        @PathVariable("settlementId") Long settlementId,
        @RequestBody SettlementRejectDto rejectDto
    ) {
        try {
            log.info("정산 반려 - settlementId: {}", settlementId);
            SettlementResponseDto response = settlementService.rejectSettlement(settlementId, rejectDto);
            return ResponseEntity.ok(ApiResponse.success(response, "정산이 반려되었습니다."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("정산 반려 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "SETTLEMENT_REJECT_ERROR")
            );
        }
    }

    /**
     * 정산 상세 조회
     */
    @GetMapping("/{settlementId}")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> getSettlement(@PathVariable("settlementId") Long settlementId) {
        try {
            SettlementResponseDto response = settlementService.getSettlement(settlementId);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "SETTLEMENT_NOT_FOUND")
            );
        }
    }

    /**
     * 프로젝트별 정산 목록 조회
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<SettlementResponseDto>>> getSettlementsByProject(@PathVariable("projectId") Long projectId) {
        List<SettlementResponseDto> response = settlementService.getSettlementsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 상태별 정산 목록 조회 (관리자)
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<SettlementResponseDto>>> getSettlementsByStatus(@PathVariable("status") String status) {
        try {
            List<SettlementResponseDto> response = settlementService.getSettlementsByStatus(status);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("유효하지 않은 상태입니다.", "INVALID_STATUS")
            );
        }
    }

    /**
     * 대기 중인 정산 개수 조회 (관리자 대시보드용)
     */
    @GetMapping("/pending/count")
    public ResponseEntity<ApiResponse<Long>> getPendingSettlementCount() {
        Long count = settlementService.getPendingSettlementCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
