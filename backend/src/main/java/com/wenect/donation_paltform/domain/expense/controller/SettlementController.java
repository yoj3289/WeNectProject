package com.wenect.donation_paltform.domain.expense.controller;

import com.wenect.donation_paltform.domain.expense.dto.SettlementSummaryResponse;
import com.wenect.donation_paltform.domain.expense.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 결산 관련 컨트롤러
 */
@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class SettlementController {

    private final SettlementService settlementService;

    /**
     * 프로젝트 결산 요약 조회
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<SettlementSummaryResponse> getSettlementSummary(@PathVariable Long projectId) {
        log.info("프로젝트 결산 요약 조회 요청 - projectId: {}", projectId);
        SettlementSummaryResponse summary = settlementService.getSettlementSummary(projectId);
        return ResponseEntity.ok(summary);
    }
}
