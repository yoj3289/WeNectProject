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
        log.info("프로젝트로 저금통 조회 요청 - projectId: {}", projectId);

        PiggyBank piggyBank = piggyBankRepository.findByProjectId(projectId)
            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트의 저금통을 찾을 수 없습니다."));

        // 잔액 정합성 검증 (totalAmount - withdrawnAmount = balance)
        validatePiggyBankBalance(piggyBank);

        log.info("조회된 저금통 - piggyId: {}, projectId: {}, totalAmount: {}, balance: {}",
            piggyBank.getPiggyId(), piggyBank.getProjectId(), piggyBank.getTotalAmount(), piggyBank.getBalance());

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        log.info("조회된 프로젝트 - projectId: {}, title: {}", project.getProjectId(), project.getTitle());

        return PiggyBankResponseDto.fromEntityWithProject(piggyBank, project.getTitle());
    }

    /**
     * 저금통 상세 정보 조회 (지출 내역 포함)
     */
    @Transactional(readOnly = true)
    public PiggyBankDetailDto getPiggyBankDetail(Long piggyId) {
        log.info("저금통 상세 조회 요청 - piggyId: {}", piggyId);

        PiggyBank piggyBank = piggyBankRepository.findById(piggyId)
            .orElseThrow(() -> new IllegalArgumentException("저금통을 찾을 수 없습니다."));

        // 잔액 정합성 검증 (totalAmount - withdrawnAmount = balance)
        validatePiggyBankBalance(piggyBank);

        log.info("조회된 저금통 - piggyId: {}, projectId: {}, totalAmount: {}, withdrawnAmount: {}, balance: {}, status: {}",
            piggyBank.getPiggyId(), piggyBank.getProjectId(), piggyBank.getTotalAmount(),
            piggyBank.getWithdrawnAmount(), piggyBank.getBalance(), piggyBank.getStatus());

        Project project = projectRepository.findById(piggyBank.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        log.info("조회된 프로젝트 - projectId: {}, title: {}, status: {}",
            project.getProjectId(), project.getTitle(), project.getStatus());

        // 모든 지출 내역 조회 (상태 무관, 지출일 기준 내림차순)
        List<Expense> allExpenses = expenseRepository.findByProjectIdOrderByExpenseDateDesc(
            piggyBank.getProjectId()
        );

        List<ExpenseResponse> withdrawalHistory = allExpenses.stream()
            .map(ExpenseResponse::from)
            .collect(Collectors.toList());

        // 승인된 지출만 필터링 (카테고리 통계용)
        List<Expense> approvedExpenses = allExpenses.stream()
            .filter(e -> e.getStatus() == Expense.ExpenseStatus.APPROVED)
            .collect(Collectors.toList());

        // 카테고리별 통계 계산 (승인된 지출만)
        List<CategoryStatDto> categoryStats = calculateCategoryStats(approvedExpenses, piggyBank.getWithdrawnAmount());

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
     * 저금통 인출 요청 (지출 내역 생성 - 관리자 승인 대기)
     */
    @Transactional
    public PiggyBankResponseDto withdraw(Long piggyId, WithdrawalRequestDto requestDto, MultipartFile receiptFile) throws IOException {
        // 1. 저금통 조회
        PiggyBank piggyBank = piggyBankRepository.findById(piggyId)
            .orElseThrow(() -> new IllegalArgumentException("저금통을 찾을 수 없습니다."));

        // 2. 인출 가능 여부 확인 (잔액 확인)
        if (piggyBank.getStatus() != PiggyBank.PiggyBankStatus.ACTIVE) {
            throw new IllegalStateException("활성 상태의 저금통만 인출 요청이 가능합니다.");
        }

        if (piggyBank.getBalance().compareTo(requestDto.getAmount()) < 0) {
            throw new IllegalArgumentException(
                String.format("잔액이 부족합니다. 현재 잔액: %s원, 요청 금액: %s원",
                    piggyBank.getBalance(), requestDto.getAmount())
            );
        }

        // 3. 영수증 파일 업로드
        if (receiptFile == null || receiptFile.isEmpty()) {
            throw new IllegalArgumentException("영수증은 필수입니다.");
        }

        String receiptUrl = fileStorageService.saveFile(receiptFile);

        // 4. 지출 내역 생성 (PENDING 상태 - 관리자 승인 대기)
        Expense expense = Expense.builder()
            .projectId(piggyBank.getProjectId())
            .expenseDate(requestDto.getExpenseDate())
            .category(requestDto.getCategory())
            .description(requestDto.getDescription())
            .amount(requestDto.getAmount())
            .receiptUrl(receiptUrl)
            .status(Expense.ExpenseStatus.PENDING) // 관리자 승인 대기
            .build();

        expenseRepository.save(expense);

        log.info("저금통 인출 요청 생성 - piggyId: {}, amount: {}, status: PENDING (관리자 승인 대기)",
            piggyId, requestDto.getAmount());

        // NOTE: 관리자 승인 전까지는 저금통에서 실제로 차감하지 않음

        Project project = projectRepository.findById(piggyBank.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        return PiggyBankResponseDto.fromEntityWithProject(piggyBank, project.getTitle());
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

    /**
     * 저금통 잔액 정합성 검증
     * totalAmount - withdrawnAmount = balance 여부 확인
     * 불일치 시 로그 경고 출력 (데이터 오류 감지용)
     */
    private void validatePiggyBankBalance(PiggyBank piggyBank) {
        BigDecimal expectedBalance = piggyBank.getTotalAmount().subtract(piggyBank.getWithdrawnAmount());

        if (expectedBalance.compareTo(piggyBank.getBalance()) != 0) {
            log.warn("저금통 잔액 불일치 감지! piggyId: {}, totalAmount: {}, withdrawnAmount: {}, " +
                    "저장된 balance: {}, 계산된 balance: {}",
                    piggyBank.getPiggyId(), piggyBank.getTotalAmount(), piggyBank.getWithdrawnAmount(),
                    piggyBank.getBalance(), expectedBalance);
        }

        // 잔액이 음수인 경우 에러
        if (piggyBank.getBalance().compareTo(BigDecimal.ZERO) < 0) {
            log.error("저금통 잔액이 음수입니다! piggyId: {}, balance: {}",
                    piggyBank.getPiggyId(), piggyBank.getBalance());
            throw new IllegalStateException("저금통 잔액 오류: 잔액이 음수입니다.");
        }
    }
}
