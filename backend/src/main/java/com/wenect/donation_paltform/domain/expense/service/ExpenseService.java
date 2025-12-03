package com.wenect.donation_paltform.domain.expense.service;

import com.wenect.donation_paltform.domain.expense.dto.ExpenseRequest;
import com.wenect.donation_paltform.domain.expense.dto.ExpenseResponse;
import com.wenect.donation_paltform.domain.expense.entity.Expense;
import com.wenect.donation_paltform.domain.expense.repository.ExpenseRepository;
import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import com.wenect.donation_paltform.domain.piggybank.repository.PiggyBankRepository;
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
    private final PiggyBankRepository piggyBankRepository;
    private final ExpenseEmailService expenseEmailService;
    private final com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository organizationRepository;

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

        // Project → Organization 조회 및 출금 요청 접수 이메일 발송
        com.wenect.donation_paltform.domain.organization.entity.Organization organization =
                organizationRepository.findById(project.getOrgId())
                        .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        expenseEmailService.sendWithdrawalRequestEmail(savedExpense, organization);

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
     * 전체 지출 내역 상태별 조회 (관리자) - 프로젝트 제목 포함
     */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpensesByStatus(String status) {
        Expense.ExpenseStatus expenseStatus = Expense.ExpenseStatus.valueOf(status.toUpperCase());
        List<Expense> expenses = expenseRepository.findByStatusOrderByCreatedAtDesc(expenseStatus);

        // 프로젝트 ID 목록 추출 및 일괄 조회
        List<Long> projectIds = expenses.stream()
                .map(Expense::getProjectId)
                .distinct()
                .collect(Collectors.toList());

        // 프로젝트 ID -> 제목 매핑
        java.util.Map<Long, String> projectTitleMap = projectRepository.findAllById(projectIds)
                .stream()
                .collect(Collectors.toMap(Project::getProjectId, Project::getTitle));

        return expenses.stream()
                .map(expense -> ExpenseResponse.from(expense, projectTitleMap.get(expense.getProjectId())))
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
     * 지출 승인 (관리자) - 저금통에서 실제 차감
     * @Transactional로 인해 저금통 인출과 지출 승인이 원자적으로 처리됨
     * 어느 단계에서든 예외 발생 시 전체 롤백
     */
    @Transactional
    public ExpenseResponse approveExpense(Long expenseId) {
        // 1. 지출 내역 조회
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        // 2. 상태 검증
        if (expense.getStatus() != Expense.ExpenseStatus.PENDING) {
            throw new IllegalStateException("대기 중인 지출만 승인 가능합니다.");
        }

        // 3. 저금통 조회
        PiggyBank piggyBank = piggyBankRepository.findByProjectId(expense.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("저금통을 찾을 수 없습니다."));

        // 4. 저금통 인출 가능 상태 확인
        if (!piggyBank.canWithdraw()) {
            throw new IllegalStateException("저금통이 인출 가능한 상태가 아닙니다.");
        }

        // 5. 잔액 확인 (withdraw() 메서드 내부에서도 검증하지만 사전에 명확한 에러 메시지 제공)
        if (piggyBank.getBalance().compareTo(expense.getAmount()) < 0) {
            throw new IllegalArgumentException(
                String.format("저금통 잔액이 부족합니다. 현재 잔액: %s원, 요청 금액: %s원",
                    piggyBank.getBalance(), expense.getAmount()));
        }

        // 6. 지출 승인 처리 먼저 (상태 변경)
        expense.approve();

        // 7. 저금통에서 인출 (잔액 차감 및 검증)
        // withdraw() 내부에서 recalculateBalance() 호출하여 잔액 정합성 보장
        piggyBank.withdraw(expense.getAmount());

        // 8. 영속성 컨텍스트에서 자동 저장되지만 명시적으로 저장하여 순서 보장
        Expense approvedExpense = expenseRepository.save(expense);
        piggyBankRepository.save(piggyBank);

        log.info("지출 승인 완료 - expenseId: {}, piggyId: {}, amount: {}, 이전잔액: {}, 현재잔액: {}",
                expenseId, piggyBank.getPiggyId(), expense.getAmount(),
                piggyBank.getBalance().add(expense.getAmount()), piggyBank.getBalance());

        // 9. Project → Organization 조회 및 출금 승인 완료 이메일 발송
        Project project = projectRepository.findById(expense.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        com.wenect.donation_paltform.domain.organization.entity.Organization organization =
                organizationRepository.findById(project.getOrgId())
                        .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        expenseEmailService.sendWithdrawalApprovalEmail(approvedExpense, organization);

        return ExpenseResponse.from(approvedExpense);
    }

    /**
     * 지출 반려 (관리자)
     */
    @Transactional
    public ExpenseResponse rejectExpense(Long expenseId, String rejectionReason) {
        // 1. 지출 내역 조회
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        // 2. 상태 검증
        if (expense.getStatus() != Expense.ExpenseStatus.PENDING) {
            throw new IllegalStateException("대기 중인 지출만 반려 가능합니다.");
        }

        // 3. 반려 사유 검증
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new IllegalArgumentException("반려 사유는 필수입니다.");
        }

        // 4. 지출 반려 처리
        expense.reject(rejectionReason);
        Expense rejectedExpense = expenseRepository.save(expense);

        log.info("지출 반려 완료 - expenseId: {}, reason: {}", expenseId, rejectionReason);

        // 5. Project → Organization 조회 및 출금 반려 이메일 발송
        Project project = projectRepository.findById(expense.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        com.wenect.donation_paltform.domain.organization.entity.Organization organization =
                organizationRepository.findById(project.getOrgId())
                        .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        expenseEmailService.sendWithdrawalRejectionEmail(rejectedExpense, organization);

        return ExpenseResponse.from(rejectedExpense);
    }
}
