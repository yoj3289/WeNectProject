package com.wenect.donation_paltform.domain.expense.controller;

import com.wenect.donation_paltform.domain.expense.dto.ExpenseRequest;
import com.wenect.donation_paltform.domain.expense.dto.ExpenseResponse;
import com.wenect.donation_paltform.domain.expense.service.ExpenseService;
import com.wenect.donation_paltform.global.service.RemoteFileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * 지출 내역 관련 컨트롤러
 */
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class ExpenseController {

    private final ExpenseService expenseService;
    private final RemoteFileStorageService fileStorageService;

    /**
     * 지출 내역 등록
     */
    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        log.info("지출 내역 등록 요청 - projectId: {}, amount: {}", request.getProjectId(), request.getAmount());
        ExpenseResponse response = expenseService.createExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 지출 내역 등록 (파일 업로드 포함)
     */
    @PostMapping("/with-receipt")
    public ResponseEntity<ExpenseResponse> createExpenseWithReceipt(
            @RequestParam("projectId") Long projectId,
            @RequestParam("expenseDate") String expenseDate,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("amount") String amount,
            @RequestParam("receiptFile") MultipartFile receiptFile) {

        try {
            log.info("지출 내역 등록 요청 (파일 업로드) - projectId: {}, amount: {}", projectId, amount);

            // 영수증 파일 저장
            String receiptUrl = fileStorageService.saveExpenseReceipt(receiptFile);

            // ExpenseRequest 생성
            ExpenseRequest request = ExpenseRequest.builder()
                    .projectId(projectId)
                    .expenseDate(java.time.LocalDate.parse(expenseDate))
                    .category(category)
                    .description(description)
                    .amount(new java.math.BigDecimal(amount))
                    .receiptUrl(receiptUrl)
                    .build();

            ExpenseResponse response = expenseService.createExpense(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            log.error("영수증 파일 저장 실패", e);
            throw new RuntimeException("영수증 파일 저장 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 프로젝트별 지출 내역 목록 조회
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByProject(@PathVariable("projectId") Long projectId) {
        log.info("프로젝트별 지출 내역 조회 요청 - projectId: {}", projectId);
        List<ExpenseResponse> expenses = expenseService.getAllExpensesByProject(projectId);
        return ResponseEntity.ok(expenses);
    }

    /**
     * 프로젝트별 + 상태별 지출 내역 조회
     */
    @GetMapping("/project/{projectId}/status/{status}")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByProjectAndStatus(
            @PathVariable("projectId") Long projectId,
            @PathVariable("status") String status) {
        log.info("프로젝트별 + 상태별 지출 내역 조회 요청 - projectId: {}, status: {}", projectId, status);
        List<ExpenseResponse> expenses = expenseService.getExpensesByProjectAndStatus(projectId, status);
        return ResponseEntity.ok(expenses);
    }

    /**
     * 지출 내역 상세 조회
     */
    @GetMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> getExpenseById(@PathVariable("expenseId") Long expenseId) {
        log.info("지출 내역 상세 조회 요청 - expenseId: {}", expenseId);
        ExpenseResponse expense = expenseService.getExpenseById(expenseId);
        return ResponseEntity.ok(expense);
    }

    /**
     * 지출 내역 수정
     */
    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable("expenseId") Long expenseId,
            @Valid @RequestBody ExpenseRequest request) {
        log.info("지출 내역 수정 요청 - expenseId: {}", expenseId);
        ExpenseResponse response = expenseService.updateExpense(expenseId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 지출 내역 삭제
     */
    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable("expenseId") Long expenseId) {
        log.info("지출 내역 삭제 요청 - expenseId: {}", expenseId);
        expenseService.deleteExpense(expenseId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 지출 승인 (관리자)
     */
    @PostMapping("/{expenseId}/approve")
    public ResponseEntity<ExpenseResponse> approveExpense(@PathVariable("expenseId") Long expenseId) {
        log.info("지출 승인 요청 - expenseId: {}", expenseId);
        ExpenseResponse response = expenseService.approveExpense(expenseId);
        return ResponseEntity.ok(response);
    }

    /**
     * 지출 반려 (관리자)
     */
    @PostMapping("/{expenseId}/reject")
    public ResponseEntity<ExpenseResponse> rejectExpense(
            @PathVariable("expenseId") Long expenseId,
            @RequestParam("reason") String reason) {
        log.info("지출 반려 요청 - expenseId: {}, reason: {}", expenseId, reason);
        ExpenseResponse response = expenseService.rejectExpense(expenseId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * 전체 지출 내역 상태별 조회 (관리자)
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ExpenseResponse>> getAllExpensesByStatus(@PathVariable("status") String status) {
        log.info("전체 지출 내역 조회 요청 - status: {}", status);
        List<ExpenseResponse> expenses = expenseService.getAllExpensesByStatus(status);
        return ResponseEntity.ok(expenses);
    }
}
