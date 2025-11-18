package com.wenect.donation_paltform.domain.expense.service;

import com.wenect.donation_paltform.domain.expense.dto.ExpenseRequest;
import com.wenect.donation_paltform.domain.expense.dto.ExpenseResponse;
import com.wenect.donation_paltform.domain.expense.entity.Expense;
import com.wenect.donation_paltform.domain.expense.repository.ExpenseRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ProjectRepository projectRepository;

    /**
     * 지출 내역 등록
     */
    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        // 프로젝트 존재 여부 확인
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 지출 내역 생성
        Expense expense = Expense.builder()
                .projectId(request.getProjectId())
                .expenseDate(request.getExpenseDate())
                .category(request.getCategory())
                .description(request.getDescription())
                .amount(request.getAmount())
                .receiptUrl(request.getReceiptUrl())
                .receiptThumbnailUrl(request.getReceiptThumbnailUrl())
                .status(Expense.ExpenseStatus.PENDING)
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        log.info("지출 내역 등록 완료 - expenseId: {}, projectId: {}", savedExpense.getExpenseId(), request.getProjectId());

        return ExpenseResponse.from(savedExpense);
    }

    /**
     * 프로젝트별 지출 내역 조회
     */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpensesByProject(Long projectId) {
        return expenseRepository.findByProjectIdOrderByExpenseDateDesc(projectId)
                .stream()
                .map(ExpenseResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 프로젝트별 + 상태별 지출 내역 조회
     */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByProjectAndStatus(Long projectId, String status) {
        Expense.ExpenseStatus expenseStatus = Expense.ExpenseStatus.valueOf(status.toUpperCase());
        return expenseRepository.findByProjectIdAndStatus(projectId, expenseStatus)
                .stream()
                .map(ExpenseResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 지출 내역 상세 조회
     */
    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));
        return ExpenseResponse.from(expense);
    }

    /**
     * 지출 내역 수정
     */
    @Transactional
    public ExpenseResponse updateExpense(Long expenseId, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        // PENDING 상태일 때만 수정 가능
        if (expense.getStatus() != Expense.ExpenseStatus.PENDING) {
            throw new IllegalStateException("승인/반려된 지출 내역은 수정할 수 없습니다.");
        }

        // 지출 내역 업데이트
        expense.setExpenseDate(request.getExpenseDate());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setReceiptUrl(request.getReceiptUrl());
        expense.setReceiptThumbnailUrl(request.getReceiptThumbnailUrl());

        Expense updatedExpense = expenseRepository.save(expense);
        log.info("지출 내역 수정 완료 - expenseId: {}", expenseId);

        return ExpenseResponse.from(updatedExpense);
    }

    /**
     * 지출 내역 삭제
     */
    @Transactional
    public void deleteExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        // PENDING 상태일 때만 삭제 가능
        if (expense.getStatus() != Expense.ExpenseStatus.PENDING) {
            throw new IllegalStateException("승인/반려된 지출 내역은 삭제할 수 없습니다.");
        }

        expenseRepository.delete(expense);
        log.info("지출 내역 삭제 완료 - expenseId: {}", expenseId);
    }

    /**
     * 지출 승인 (관리자)
     */
    @Transactional
    public ExpenseResponse approveExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        if (expense.getStatus() != Expense.ExpenseStatus.PENDING) {
            throw new IllegalStateException("대기 상태의 지출 내역만 승인할 수 있습니다.");
        }

        expense.setStatus(Expense.ExpenseStatus.APPROVED);
        expense.setRejectionReason(null); // 승인 시 반려 사유 제거

        Expense approvedExpense = expenseRepository.save(expense);
        log.info("지출 승인 완료 - expenseId: {}, projectId: {}", expenseId, expense.getProjectId());

        return ExpenseResponse.from(approvedExpense);
    }

    /**
     * 지출 반려 (관리자)
     */
    @Transactional
    public ExpenseResponse rejectExpense(Long expenseId, String rejectionReason) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        if (expense.getStatus() != Expense.ExpenseStatus.PENDING) {
            throw new IllegalStateException("대기 상태의 지출 내역만 반려할 수 있습니다.");
        }

        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new IllegalArgumentException("반려 사유는 필수입니다.");
        }

        expense.setStatus(Expense.ExpenseStatus.REJECTED);
        expense.setRejectionReason(rejectionReason);

        Expense rejectedExpense = expenseRepository.save(expense);
        log.info("지출 반려 완료 - expenseId: {}, reason: {}", expenseId, rejectionReason);

        return ExpenseResponse.from(rejectedExpense);
    }
}
