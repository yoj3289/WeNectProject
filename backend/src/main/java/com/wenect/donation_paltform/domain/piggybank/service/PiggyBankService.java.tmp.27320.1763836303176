package com.wenect.donation_paltform.domain.piggybank.service;

import com.wenect.donation_paltform.domain.expense.dto.ExpenseRequest;
import com.wenect.donation_paltform.domain.expense.dto.ExpenseResponse;
import com.wenect.donation_paltform.domain.expense.entity.Expense;
import com.wenect.donation_paltform.domain.expense.repository.ExpenseRepository;
import com.wenect.donation_paltform.domain.piggybank.dto.*;
import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import com.wenect.donation_paltform.domain.piggybank.repository.PiggyBankRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.global.service.RemoteFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 저금통 관리 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PiggyBankService {

    private final PiggyBankRepository piggyBankRepository;
    private final ProjectRepository projectRepository;
    private final ExpenseRepository expenseRepository;
    private final RemoteFileStorageService fileStorageService;

    /**
     * 프로젝트 ID로 저금통 조회
     */
    @Transactional(readOnly = true)
    public PiggyBankResponseDto getPiggyBankByProject(Long projectId) {
        PiggyBank piggyBank = piggyBankRepository.findByProjectId(projectId)
            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트의 저금통을 찾을 수 없습니다."));

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        return PiggyBankResponseDto.fromEntityWithProject(piggyBank, project.getTitle());
    }

    /**
     * 저금통 상세 정보 조회 (지출 내역 포함)
     */
    @Transactional(readOnly = true)
    public PiggyBankDetailDto getPiggyBankDetail(Long piggyId) {
        PiggyBank piggyBank = piggyBankRepository.findById(piggyId)
            .orElseThrow(() -> new IllegalArgumentException("저금통을 찾을 수 없습니다."));

        Project project = projectRepository.findById(piggyBank.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 승인된 지출 내역만 조회
        List<Expense> expenses = expenseRepository.findByProjectIdAndStatus(
            piggyBank.getProjectId(),
            Expense.ExpenseStatus.APPROVED
        );

        List<ExpenseResponse> withdrawalHistory = expenses.stream()
            .map(ExpenseResponse::from)
            .collect(Collectors.toList());

        // 카테고리별 통계 계산
        List<CategoryStatDto> categoryStats = calculateCategoryStats(expenses, piggyBank.getWithdrawnAmount());

        return PiggyBankDetailDto.builder()
            .piggyId(piggyBank.getPiggyId())
            .projectId(piggyBank.getProjectId())
            .projectTitle(project.getTitle())
            .totalAmount(piggyBank.getTotalAmount())
            .withdrawnAmount(piggyBank.getWithdrawnAmount())
            .balance(piggyBank.getBalance())
            .status(piggyBank.getStatus().name())
            .lastUpdated(piggyBank.getLastUpdated())
            .createdAt(piggyBank.getCreatedAt())
            .withdrawalHistory(withdrawalHistory)
            .categoryStats(categoryStats)
            .build();
    }

    /**
     * 저금통 인출 (지출 내역 생성)
     */
    @Transactional
    public PiggyBankResponseDto withdraw(Long piggyId, WithdrawalRequestDto requestDto, MultipartFile receiptFile) throws IOException {
        // 1. 저금통 조회
        PiggyBank piggyBank = piggyBankRepository.findById(piggyId)
            .orElseThrow(() -> new IllegalArgumentException("저금통을 찾을 수 없습니다."));

        // 2. 인출 가능 여부 확인
        if (!piggyBank.canWithdraw()) {
            throw new IllegalStateException("인출 가능한 상태가 아닙니다.");
        }

        // 3. 영수증 파일 업로드
        if (receiptFile == null || receiptFile.isEmpty()) {
            throw new IllegalArgumentException("영수증은 필수입니다.");
        }

        String receiptUrl = fileStorageService.saveFile(receiptFile);

        // 4. 저금통에서 인출
        piggyBank.withdraw(requestDto.getAmount());
        PiggyBank savedPiggyBank = piggyBankRepository.save(piggyBank);

        // 5. 지출 내역 생성 (Expense 엔티티 재활용)
        Expense expense = Expense.builder()
            .projectId(piggyBank.getProjectId())
            .expenseDate(requestDto.getExpenseDate())
            .category(requestDto.getCategory())
            .description(requestDto.getDescription())
            .amount(requestDto.getAmount())
            .receiptUrl(receiptUrl)
            .status(Expense.ExpenseStatus.APPROVED) // 저금통 인출은 자동 승인
            .build();

        expenseRepository.save(expense);

        log.info("저금통 인출 완료 - piggyId: {}, amount: {}, balance: {}",
            piggyId, requestDto.getAmount(), savedPiggyBank.getBalance());

        // 6. 잔액이 0이 되면 프로젝트 상태를 SETTLEMENT로 유지 (결산 완료 대기)
        if (savedPiggyBank.isBalanceZero()) {
            log.info("저금통 잔액 0원 - 프로젝트 결산 완료 가능 상태");
        }

        Project project = projectRepository.findById(piggyBank.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        return PiggyBankResponseDto.fromEntityWithProject(savedPiggyBank, project.getTitle());
    }

    /**
     * 기관의 모든 저금통 조회
     */
    @Transactional(readOnly = true)
    public List<PiggyBankResponseDto> getPiggyBanksByOrganization(List<Long> projectIds) {
        List<PiggyBank> piggyBanks = piggyBankRepository.findByProjectIds(projectIds);

        return piggyBanks.stream()
            .map(pb -> {
                Project project = projectRepository.findById(pb.getProjectId()).orElse(null);
                String projectTitle = project != null ? project.getTitle() : "Unknown";
                return PiggyBankResponseDto.fromEntityWithProject(pb, projectTitle);
            })
            .collect(Collectors.toList());
    }

    /**
     * 전체 저금통 잔액 합계 (기관 대시보드용)
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalBalance(List<Long> projectIds) {
        List<PiggyBank> piggyBanks = piggyBankRepository.findByProjectIds(projectIds);

        return piggyBanks.stream()
            .map(PiggyBank::getBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 카테고리별 지출 통계 계산
     */
    private List<CategoryStatDto> calculateCategoryStats(List<Expense> expenses, BigDecimal totalWithdrawn) {
        if (expenses.isEmpty()) {
            return List.of();
        }

        // 카테고리별 그룹화
        Map<String, List<Expense>> categoryMap = expenses.stream()
            .collect(Collectors.groupingBy(Expense::getCategory));

        return categoryMap.entrySet().stream()
            .map(entry -> {
                String category = entry.getKey();
                List<Expense> categoryExpenses = entry.getValue();

                BigDecimal categoryAmount = categoryExpenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                Long count = (long) categoryExpenses.size();

                // 비율 계산
                Double percentage = totalWithdrawn.compareTo(BigDecimal.ZERO) > 0
                    ? categoryAmount.divide(totalWithdrawn, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue()
                    : 0.0;

                return CategoryStatDto.builder()
                    .category(category)
                    .amount(categoryAmount)
                    .count(count)
                    .percentage(percentage)
                    .build();
            })
            .sorted((a, b) -> b.getAmount().compareTo(a.getAmount())) // 금액 내림차순 정렬
            .collect(Collectors.toList());
    }
}
