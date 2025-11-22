package com.wenect.donation_paltform.domain.piggybank.controller;

import com.wenect.donation_paltform.domain.piggybank.dto.*;
import com.wenect.donation_paltform.domain.piggybank.service.PiggyBankService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

/**
 * 저금통 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/piggy-banks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class PiggyBankController {

    private final PiggyBankService piggyBankService;

    /**
     * 프로젝트 ID로 저금통 조회
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<PiggyBankResponseDto>> getPiggyBankByProject(@PathVariable("projectId") Long projectId) {
        try {
            PiggyBankResponseDto response = piggyBankService.getPiggyBankByProject(projectId);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "PIGGY_BANK_NOT_FOUND")
            );
        }
    }

    /**
     * 저금통 상세 정보 조회 (지출 내역 포함)
     */
    @GetMapping("/{piggyId}/detail")
    public ResponseEntity<ApiResponse<PiggyBankDetailDto>> getPiggyBankDetail(@PathVariable("piggyId") Long piggyId) {
        try {
            PiggyBankDetailDto response = piggyBankService.getPiggyBankDetail(piggyId);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "PIGGY_BANK_NOT_FOUND")
            );
        }
    }

    /**
     * 저금통 인출 (기관 사용자)
     */
    @PostMapping("/{piggyId}/withdraw")
    public ResponseEntity<ApiResponse<PiggyBankResponseDto>> withdraw(
        @PathVariable("piggyId") Long piggyId,
        @RequestPart("data") WithdrawalRequestDto requestDto,
        @RequestPart("receiptFile") MultipartFile receiptFile
    ) {
        try {
            log.info("저금통 인출 요청 - piggyId: {}, amount: {}", piggyId, requestDto.getAmount());
            PiggyBankResponseDto response = piggyBankService.withdraw(piggyId, requestDto, receiptFile);
            return ResponseEntity.ok(ApiResponse.success(response, "인출이 완료되었습니다."));
        } catch (IOException e) {
            log.error("영수증 업로드 실패", e);
            return ResponseEntity.badRequest().body(
                ApiResponse.error("영수증 업로드에 실패했습니다.", "FILE_UPLOAD_ERROR")
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("인출 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                ApiResponse.error(e.getMessage(), "WITHDRAWAL_ERROR")
            );
        }
    }

    /**
     * 기관의 모든 저금통 조회
     */
    @PostMapping("/organization")
    public ResponseEntity<ApiResponse<List<PiggyBankResponseDto>>> getPiggyBanksByOrganization(
        @RequestBody List<Long> projectIds
    ) {
        List<PiggyBankResponseDto> response = piggyBankService.getPiggyBanksByOrganization(projectIds);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 전체 저금통 잔액 합계 (기관 대시보드용)
     */
    @PostMapping("/total-balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalBalance(@RequestBody List<Long> projectIds) {
        BigDecimal totalBalance = piggyBankService.getTotalBalance(projectIds);
        return ResponseEntity.ok(ApiResponse.success(totalBalance));
    }
}
