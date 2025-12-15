package com.wenect.donation_paltform.domain.finance.controller;

import com.wenect.donation_paltform.domain.finance.dto.FinanceDashboardDto;
import com.wenect.donation_paltform.domain.finance.dto.PlatformAccountDto;
import com.wenect.donation_paltform.domain.finance.dto.PlatformLedgerDto;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerCategory;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerType;
import com.wenect.donation_paltform.domain.finance.service.FinanceDashboardService;
import com.wenect.donation_paltform.domain.finance.service.LedgerService;
import com.wenect.donation_paltform.domain.finance.service.PgSettlementService;
import com.wenect.donation_paltform.domain.finance.service.PlatformAccountService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 재정 관리 컨트롤러 (관리자용)
 */
@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class FinanceAdminController {

    private final PlatformAccountService accountService;
    private final LedgerService ledgerService;
    private final PgSettlementService pgSettlementService;
    private final FinanceDashboardService dashboardService;

    // ==================== 대시보드 ====================

    /**
     * 재정 대시보드 조회
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<FinanceDashboardDto.DashboardResponse>> getDashboard() {
        FinanceDashboardDto.DashboardResponse dashboard = dashboardService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    /**
     * 재정 요약 조회
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<FinanceDashboardDto.SummaryResponse>> getSummary() {
        FinanceDashboardDto.SummaryResponse summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * 일별 보고서 조회
     */
    @GetMapping("/reports/daily")
    public ResponseEntity<ApiResponse<List<FinanceDashboardDto.DailyReport>>> getDailyReports(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<FinanceDashboardDto.DailyReport> reports = dashboardService.getDailyReports(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    /**
     * 알림 조회
     */
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<FinanceDashboardDto.AlertItem>>> getAlerts() {
        List<FinanceDashboardDto.AlertItem> alerts = dashboardService.getAlerts();
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    // ==================== 플랫폼 계좌 관리 ====================

    /**
     * 플랫폼 계좌 목록 조회
     */
    @GetMapping("/accounts")
    public ResponseEntity<ApiResponse<List<PlatformAccountDto.Response>>> getAccounts() {
        List<PlatformAccountDto.Response> accounts = accountService.getActiveAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    /**
     * 플랫폼 계좌 상세 조회
     */
    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<ApiResponse<PlatformAccountDto.DetailResponse>> getAccount(
            @PathVariable Long accountId) {
        PlatformAccountDto.DetailResponse account = accountService.getAccount(accountId);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    /**
     * 플랫폼 계좌 생성
     */
    @PostMapping("/accounts")
    public ResponseEntity<ApiResponse<PlatformAccountDto.Response>> createAccount(
            @RequestBody PlatformAccountDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        PlatformAccountDto.Response account = accountService.createAccount(request, adminId);
        return ResponseEntity.ok(ApiResponse.success(account, "플랫폼 계좌가 생성되었습니다."));
    }

    /**
     * 플랫폼 계좌 수정
     */
    @PutMapping("/accounts/{accountId}")
    public ResponseEntity<ApiResponse<PlatformAccountDto.Response>> updateAccount(
            @PathVariable Long accountId,
            @RequestBody PlatformAccountDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        PlatformAccountDto.Response account = accountService.updateAccount(accountId, request, adminId);
        return ResponseEntity.ok(ApiResponse.success(account, "플랫폼 계좌가 수정되었습니다."));
    }

    /**
     * 플랫폼 계좌 비활성화
     */
    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(
            @PathVariable Long accountId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        accountService.deactivateAccount(accountId, adminId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "플랫폼 계좌가 비활성화되었습니다."));
    }

    // ==================== 원장 관리 ====================

    /**
     * 원장 기록 조회
     */
    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<Page<PlatformLedgerDto.Response>>> getLedgerEntries(
            @PageableDefault(size = 20) Pageable pageable) {
        Long primaryAccountId = accountService.getPrimaryAccountId();
        Page<PlatformLedgerDto.Response> entries = ledgerService.getLedgerEntries(primaryAccountId, pageable);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    /**
     * 유형별 원장 기록 조회
     */
    @GetMapping("/ledger/type/{type}")
    public ResponseEntity<ApiResponse<Page<PlatformLedgerDto.Response>>> getLedgerEntriesByType(
            @PathVariable LedgerType type,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PlatformLedgerDto.Response> entries = ledgerService.getLedgerEntriesByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    /**
     * 카테고리별 원장 기록 조회
     */
    @GetMapping("/ledger/category/{category}")
    public ResponseEntity<ApiResponse<Page<PlatformLedgerDto.Response>>> getLedgerEntriesByCategory(
            @PathVariable LedgerCategory category,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PlatformLedgerDto.Response> entries = ledgerService.getLedgerEntriesByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    /**
     * 프로젝트별 원장 기록 조회
     */
    @GetMapping("/ledger/project/{projectId}")
    public ResponseEntity<ApiResponse<List<PlatformLedgerDto.Response>>> getLedgerEntriesByProject(
            @PathVariable Long projectId) {
        List<PlatformLedgerDto.Response> entries = ledgerService.getLedgerEntriesByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    /**
     * 기관별 원장 기록 조회
     */
    @GetMapping("/ledger/organization/{organizationId}")
    public ResponseEntity<ApiResponse<List<PlatformLedgerDto.Response>>> getLedgerEntriesByOrganization(
            @PathVariable Long organizationId) {
        List<PlatformLedgerDto.Response> entries = ledgerService.getLedgerEntriesByOrganization(organizationId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    /**
     * 원장 요약 조회
     */
    @GetMapping("/ledger/summary")
    public ResponseEntity<ApiResponse<PlatformLedgerDto.SummaryResponse>> getLedgerSummary() {
        Long primaryAccountId = accountService.getPrimaryAccountId();
        PlatformLedgerDto.SummaryResponse summary = ledgerService.getLedgerSummary(primaryAccountId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * 원장 무결성 검증
     */
    @GetMapping("/ledger/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyLedgerIntegrity() {
        Long primaryAccountId = accountService.getPrimaryAccountId();
        boolean isValid = ledgerService.verifyLedgerIntegrity(primaryAccountId);
        String message = isValid ? "원장 무결성이 확인되었습니다." : "원장 무결성에 문제가 있습니다.";
        return ResponseEntity.ok(ApiResponse.success(isValid, message));
    }

    /**
     * 조정 기록 생성 (관리자용)
     */
    @PostMapping("/ledger/adjustment")
    public ResponseEntity<ApiResponse<PlatformLedgerDto.Response>> createAdjustment(
            @RequestBody PlatformLedgerDto.CreateAdjustmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        Long primaryAccountId = accountService.getPrimaryAccountId();
        var ledger = ledgerService.recordAdjustment(
                primaryAccountId,
                request.getLedgerType(),
                request.getAmount(),
                request.getDescription(),
                request.getReason(),
                adminId
        );
        return ResponseEntity.ok(ApiResponse.success(
                PlatformLedgerDto.Response.from(ledger), "조정 기록이 생성되었습니다."));
    }

    // ==================== PG 정산 관리 ====================

    /**
     * PG 정산 목록 조회
     */
    @GetMapping("/pg-settlements")
    public ResponseEntity<ApiResponse<Page<PgSettlement>>> getPgSettlements(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PgSettlement> settlements = pgSettlementService.getSettlements(pageable);
        return ResponseEntity.ok(ApiResponse.success(settlements));
    }

    /**
     * 불일치 PG 정산 목록 조회
     */
    @GetMapping("/pg-settlements/mismatched")
    public ResponseEntity<ApiResponse<List<PgSettlement>>> getMismatchedSettlements() {
        List<PgSettlement> settlements = pgSettlementService.getMismatchedSettlements();
        return ResponseEntity.ok(ApiResponse.success(settlements));
    }

    /**
     * 대사 미완료 PG 정산 목록 조회
     */
    @GetMapping("/pg-settlements/pending-reconciliation")
    public ResponseEntity<ApiResponse<List<PgSettlement>>> getPendingReconciliationSettlements() {
        List<PgSettlement> settlements = pgSettlementService.getPendingReconciliationSettlements();
        return ResponseEntity.ok(ApiResponse.success(settlements));
    }

    /**
     * PG 정산 대사 실행
     */
    @PostMapping("/pg-settlements/{settlementId}/reconcile")
    public ResponseEntity<ApiResponse<Void>> reconcilePgSettlement(
            @PathVariable Long settlementId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        pgSettlementService.reconcilePgSettlement(settlementId, adminId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "PG 정산 대사가 완료되었습니다."));
    }

    /**
     * 불일치 PG 정산 조정
     */
    @PostMapping("/pg-settlements/{settlementId}/adjust")
    public ResponseEntity<ApiResponse<Void>> adjustMismatchedSettlement(
            @PathVariable Long settlementId,
            @RequestParam String note,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        pgSettlementService.adjustMismatchedSettlement(settlementId, note, adminId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "PG 정산이 조정되었습니다."));
    }

    /**
     * 수동 PG 정산 트리거 (테스트/시뮬레이션용)
     */
    @PostMapping("/pg-settlements/trigger")
    public ResponseEntity<ApiResponse<Void>> triggerManualSettlement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate transactionDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        pgSettlementService.triggerManualSettlement(transactionDate, adminId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "수동 PG 정산이 실행되었습니다."));
    }

    // ==================== Helper ====================

    private Long getUserId(UserDetails userDetails) {
        // UserDetails에서 사용자 ID 추출
        // 실제 구현에 맞게 수정 필요
        if (userDetails instanceof com.wenect.donation_paltform.domain.auth.entity.User) {
            return ((com.wenect.donation_paltform.domain.auth.entity.User) userDetails).getUserId();
        }
        return 0L;
    }
}
