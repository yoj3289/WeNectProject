package com.wenect.donation_paltform.domain.finance.service;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.finance.entity.FinancialAuditLog;
import com.wenect.donation_paltform.domain.finance.entity.FinancialTransaction;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement.PgProvider;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement.PgSettlementStatus;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerCategory;
import com.wenect.donation_paltform.domain.finance.repository.FinancialAuditLogRepository;
import com.wenect.donation_paltform.domain.finance.repository.FinancialTransactionRepository;
import com.wenect.donation_paltform.domain.finance.repository.PgSettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * PG사 정산 서비스
 * PG사(카카오페이, 토스페이)로부터의 정산을 관리
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PgSettlementService {

    private final PgSettlementRepository pgSettlementRepository;
    private final DonationRepository donationRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialAuditLogRepository auditLogRepository;
    private final LedgerService ledgerService;
    private final PlatformAccountService accountService;

    // PG 수수료율 (테스트용 기본값)
    private static final BigDecimal DEFAULT_PG_FEE_RATE = new BigDecimal("0.03"); // 3%

    /**
     * PG 정산 시뮬레이션 (매일 오전 9시 실행)
     * 실제 서비스에서는 PG사 API 또는 정산 파일을 통해 데이터 수신
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void simulateDailyPgSettlement() {
        log.info("Starting daily PG settlement simulation...");

        // D+1 정산: 어제 완료된 결제에 대한 정산
        LocalDate settlementDate = LocalDate.now();
        LocalDate transactionDate = LocalDate.now().minusDays(1);

        // 카카오페이 정산 시뮬레이션
        simulatePgSettlement(PgProvider.KAKAO_PAY, settlementDate, transactionDate);

        // 토스페이 정산 시뮬레이션
        simulatePgSettlement(PgProvider.TOSS_PAY, settlementDate, transactionDate);

        log.info("Daily PG settlement simulation completed");
    }

    /**
     * 특정 PG사 정산 시뮬레이션
     */
    public PgSettlement simulatePgSettlement(PgProvider provider, LocalDate settlementDate, LocalDate transactionDate) {
        // 이미 해당 기간 정산이 존재하는지 확인
        if (pgSettlementRepository.existsByPgProviderAndPeriodStartAndPeriodEnd(
                provider, transactionDate, transactionDate)) {
            log.info("PG settlement already exists: provider={}, date={}", provider, transactionDate);
            return null;
        }

        // 해당 날짜의 완료된 기부 조회
        Donation.PaymentMethod paymentMethod = provider == PgProvider.KAKAO_PAY
                ? Donation.PaymentMethod.KAKAO_PAY
                : Donation.PaymentMethod.TOSS_PAY;

        LocalDateTime startOfDay = transactionDate.atStartOfDay();
        LocalDateTime endOfDay = transactionDate.plusDays(1).atStartOfDay();

        List<Donation> donations = donationRepository.findByPaymentMethodAndStatusAndDonatedAtBetween(
                paymentMethod, Donation.DonationStatus.COMPLETED, startOfDay, endOfDay);

        if (donations.isEmpty()) {
            log.info("No donations found for PG settlement: provider={}, date={}", provider, transactionDate);
            return null;
        }

        // 총 거래액 계산
        BigDecimal totalAmount = donations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // PG 수수료 계산
        BigDecimal pgFeeRate = accountService.getPgFeeRate();
        BigDecimal pgFeeAmount = totalAmount.multiply(pgFeeRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal netAmount = totalAmount.subtract(pgFeeAmount);

        // PG 정산 기록 생성
        PgSettlement settlement = PgSettlement.builder()
                .pgProvider(provider)
                .settlementDate(settlementDate)
                .periodStart(transactionDate)
                .periodEnd(transactionDate)
                .totalTransactionAmount(totalAmount)
                .transactionCount(donations.size())
                .pgFeeAmount(pgFeeAmount)
                .netSettlementAmount(netAmount)
                .status(PgSettlementStatus.PENDING)
                .build();

        PgSettlement savedSettlement = pgSettlementRepository.save(settlement);

        log.info("PG settlement created: provider={}, date={}, amount={}, netAmount={}",
                provider, settlementDate, totalAmount, netAmount);

        // 자동 대사 실행
        reconcilePgSettlement(savedSettlement.getPgSettlementId(), null);

        return savedSettlement;
    }

    /**
     * PG 정산 대사 (Reconciliation)
     */
    public void reconcilePgSettlement(Long pgSettlementId, Long performedBy) {
        PgSettlement settlement = pgSettlementRepository.findById(pgSettlementId)
                .orElseThrow(() -> new IllegalArgumentException("PG 정산을 찾을 수 없습니다: " + pgSettlementId));

        // 해당 기간의 기부 합계 계산
        Donation.PaymentMethod paymentMethod = settlement.getPgProvider() == PgProvider.KAKAO_PAY
                ? Donation.PaymentMethod.KAKAO_PAY
                : Donation.PaymentMethod.TOSS_PAY;

        LocalDateTime startOfDay = settlement.getPeriodStart().atStartOfDay();
        LocalDateTime endOfDay = settlement.getPeriodEnd().plusDays(1).atStartOfDay();

        List<Donation> donations = donationRepository.findByPaymentMethodAndStatusAndDonatedAtBetween(
                paymentMethod, Donation.DonationStatus.COMPLETED, startOfDay, endOfDay);

        BigDecimal calculatedTotal = donations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pgFeeRate = accountService.getPgFeeRate();
        BigDecimal calculatedNetAmount = calculatedTotal.subtract(
                calculatedTotal.multiply(pgFeeRate).setScale(0, RoundingMode.HALF_UP));

        // 대사 완료 처리
        settlement.completeReconciliation(calculatedNetAmount, performedBy);
        pgSettlementRepository.save(settlement);

        // 대사 성공 시 원장에 입금 기록
        if (settlement.getStatus() == PgSettlementStatus.COMPLETED) {
            processSettlementDeposit(settlement);
        }

        // 감사 로그
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.RECONCILE)
                .entityType("PgSettlement")
                .entityId(pgSettlementId)
                .performedBy(performedBy != null ? performedBy : 0L)
                .performedByRole(performedBy != null
                        ? FinancialAuditLog.PerformerRole.ADMIN
                        : FinancialAuditLog.PerformerRole.SYSTEM)
                .description(String.format("PG 정산 대사: %s, 예상=%s, 실제=%s, 차이=%s",
                        settlement.getPgProvider(),
                        calculatedNetAmount,
                        settlement.getNetSettlementAmount(),
                        settlement.getDifferenceAmount()))
                .build();
        auditLogRepository.save(auditLog);

        log.info("PG settlement reconciled: id={}, status={}, difference={}",
                pgSettlementId, settlement.getStatus(), settlement.getDifferenceAmount());
    }

    /**
     * 정산 입금 처리 (원장 기록)
     */
    private void processSettlementDeposit(PgSettlement settlement) {
        Long platformAccountId = accountService.getPrimaryAccountId();

        // 원장에 입금 기록
        ledgerService.recordDeposit(
                platformAccountId,
                LedgerCategory.PG_SETTLEMENT,
                settlement.getNetSettlementAmount(),
                "PgSettlement",
                settlement.getPgSettlementId(),
                String.format("%s 정산 입금 (%s ~ %s)",
                        settlement.getPgProvider(),
                        settlement.getPeriodStart(),
                        settlement.getPeriodEnd()),
                null,
                null,
                null,
                "SYSTEM"
        );

        // 거래 내역 기록
        FinancialTransaction transaction = FinancialTransaction.builder()
                .transactionCode(FinancialTransaction.generateTransactionCode(
                        FinancialTransaction.TransactionType.PG_SETTLEMENT))
                .transactionType(FinancialTransaction.TransactionType.PG_SETTLEMENT)
                .amount(settlement.getTotalTransactionAmount())
                .feeAmount(settlement.getPgFeeAmount())
                .netAmount(settlement.getNetSettlementAmount())
                .fromAccountType(FinancialTransaction.AccountType.PG_PROVIDER)
                .fromAccountId(null)
                .toAccountType(FinancialTransaction.AccountType.PLATFORM)
                .toAccountId(platformAccountId)
                .pgSettlementId(settlement.getPgSettlementId())
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .description(String.format("%s 정산", settlement.getPgProvider()))
                .performedByType("SYSTEM")
                .build();
        transaction.complete();
        transactionRepository.save(transaction);

        // 플랫폼 계좌 ID 업데이트
        settlement.setPlatformAccountId(platformAccountId);
        pgSettlementRepository.save(settlement);

        log.info("PG settlement deposit processed: settlementId={}, amount={}",
                settlement.getPgSettlementId(), settlement.getNetSettlementAmount());
    }

    /**
     * 불일치 정산 조정
     */
    public void adjustMismatchedSettlement(Long pgSettlementId, String note, Long performedBy) {
        PgSettlement settlement = pgSettlementRepository.findById(pgSettlementId)
                .orElseThrow(() -> new IllegalArgumentException("PG 정산을 찾을 수 없습니다: " + pgSettlementId));

        if (settlement.getStatus() != PgSettlementStatus.MISMATCH) {
            throw new IllegalStateException("불일치 상태의 정산만 조정할 수 있습니다.");
        }

        settlement.adjustAndComplete(note);
        pgSettlementRepository.save(settlement);

        // 원장에 입금 기록 (조정 후)
        processSettlementDeposit(settlement);

        // 감사 로그
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.RECONCILE_ADJUST)
                .entityType("PgSettlement")
                .entityId(pgSettlementId)
                .performedBy(performedBy)
                .performedByRole(FinancialAuditLog.PerformerRole.ADMIN)
                .reason(note)
                .description("PG 정산 불일치 조정 완료")
                .build();
        auditLogRepository.save(auditLog);

        log.info("PG settlement adjusted: id={}", pgSettlementId);
    }

    /**
     * 정산 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<PgSettlement> getSettlements(Pageable pageable) {
        return pgSettlementRepository.findAll(pageable);
    }

    /**
     * 상태별 정산 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<PgSettlement> getSettlementsByStatus(PgSettlementStatus status, Pageable pageable) {
        return pgSettlementRepository.findByStatusOrderBySettlementDateDesc(status, pageable);
    }

    /**
     * 불일치 정산 목록 조회
     */
    @Transactional(readOnly = true)
    public List<PgSettlement> getMismatchedSettlements() {
        return pgSettlementRepository.findByStatusOrderBySettlementDateDesc(PgSettlementStatus.MISMATCH);
    }

    /**
     * 대사 미완료 정산 목록 조회
     */
    @Transactional(readOnly = true)
    public List<PgSettlement> getPendingReconciliationSettlements() {
        return pgSettlementRepository.findByIsReconciledFalseOrderBySettlementDateAsc();
    }

    /**
     * 특정 기간 정산 통계
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalSettlementAmount(LocalDate startDate, LocalDate endDate) {
        return pgSettlementRepository.sumNetSettlementAmountByDateRange(startDate, endDate);
    }

    /**
     * 수동 정산 트리거 (관리자용)
     */
    public void triggerManualSettlement(LocalDate transactionDate, Long performedBy) {
        log.info("Manual PG settlement triggered: date={}, by={}", transactionDate, performedBy);

        LocalDate settlementDate = LocalDate.now();

        simulatePgSettlement(PgProvider.KAKAO_PAY, settlementDate, transactionDate);
        simulatePgSettlement(PgProvider.TOSS_PAY, settlementDate, transactionDate);

        // 감사 로그
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.CREATE)
                .entityType("PgSettlement")
                .entityId(0L)
                .performedBy(performedBy)
                .performedByRole(FinancialAuditLog.PerformerRole.ADMIN)
                .description("수동 PG 정산 실행: " + transactionDate)
                .build();
        auditLogRepository.save(auditLog);
    }
}
