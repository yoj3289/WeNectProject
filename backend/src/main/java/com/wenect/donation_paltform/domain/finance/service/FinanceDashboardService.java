package com.wenect.donation_paltform.domain.finance.service;

import com.wenect.donation_paltform.domain.finance.dto.FinanceDashboardDto;
import com.wenect.donation_paltform.domain.finance.dto.PlatformLedgerDto;
import com.wenect.donation_paltform.domain.finance.entity.FinancialTransaction;
import com.wenect.donation_paltform.domain.finance.entity.PgSettlement;
import com.wenect.donation_paltform.domain.finance.repository.FinancialTransactionRepository;
import com.wenect.donation_paltform.domain.finance.repository.PgSettlementRepository;
import com.wenect.donation_paltform.domain.finance.repository.PlatformLedgerRepository;
import com.wenect.donation_paltform.domain.settlement.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

/**
 * 재정 대시보드 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FinanceDashboardService {

    private final PlatformAccountService accountService;
    private final LedgerService ledgerService;
    private final PgSettlementRepository pgSettlementRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final PlatformLedgerRepository ledgerRepository;
    private final SettlementRepository settlementRepository;

    /**
     * 재정 현황 요약 조회
     */
    public FinanceDashboardDto.SummaryResponse getSummary() {
        Long primaryAccountId = accountService.getPrimaryAccountId();

        // 전체 현황
        BigDecimal totalDonations = transactionRepository.sumAmountByType(
                FinancialTransaction.TransactionType.DONATION);
        BigDecimal totalPgFees = transactionRepository.sumFeeAmountByType(
                FinancialTransaction.TransactionType.PG_SETTLEMENT);
        BigDecimal totalPlatformReceived = transactionRepository.sumAmountByType(
                FinancialTransaction.TransactionType.PG_SETTLEMENT);
        BigDecimal totalOrgSettlements = transactionRepository.sumAmountByType(
                FinancialTransaction.TransactionType.ORG_SETTLEMENT);
        BigDecimal totalPlatformFees = transactionRepository.sumFeeAmountByType(
                FinancialTransaction.TransactionType.ORG_SETTLEMENT);
        BigDecimal currentBalance = ledgerService.getCurrentBalance(primaryAccountId);

        // 기간별 현황
        FinanceDashboardDto.PeriodSummary today = getPeriodSummary(LocalDate.now(), LocalDate.now());
        FinanceDashboardDto.PeriodSummary thisWeek = getPeriodSummary(
                LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
                LocalDate.now());
        FinanceDashboardDto.PeriodSummary thisMonth = getPeriodSummary(
                LocalDate.now().withDayOfMonth(1),
                LocalDate.now());

        // 대기중인 항목
        int pendingPgSettlements = pgSettlementRepository
                .findByStatusOrderBySettlementDateDesc(PgSettlement.PgSettlementStatus.PENDING).size();
        long pendingOrgSettlementsCount = settlementRepository.countByStatus(
                com.wenect.donation_paltform.domain.settlement.entity.Settlement.SettlementStatus.PENDING);
        int pendingOrgSettlements = (int) pendingOrgSettlementsCount;
        int mismatchedSettlements = pgSettlementRepository
                .findByStatusOrderBySettlementDateDesc(PgSettlement.PgSettlementStatus.MISMATCH).size();

        return FinanceDashboardDto.SummaryResponse.builder()
                .totalDonationAmount(totalDonations != null ? totalDonations : BigDecimal.ZERO)
                .totalPgFees(totalPgFees != null ? totalPgFees : BigDecimal.ZERO)
                .totalPlatformReceived(totalPlatformReceived != null ? totalPlatformReceived : BigDecimal.ZERO)
                .totalOrgSettlements(totalOrgSettlements != null ? totalOrgSettlements : BigDecimal.ZERO)
                .totalPlatformFees(totalPlatformFees != null ? totalPlatformFees : BigDecimal.ZERO)
                .currentPlatformBalance(currentBalance)
                .today(today)
                .thisWeek(thisWeek)
                .thisMonth(thisMonth)
                .pendingPgSettlements(pendingPgSettlements)
                .pendingOrgSettlements(pendingOrgSettlements)
                .mismatchedSettlements(mismatchedSettlements)
                .build();
    }

    /**
     * 기간별 요약 계산
     */
    private FinanceDashboardDto.PeriodSummary getPeriodSummary(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        BigDecimal donations = transactionRepository.sumAmountByTypeAndDateRange(
                FinancialTransaction.TransactionType.DONATION, startDateTime, endDateTime);
        BigDecimal pgSettlements = transactionRepository.sumAmountByTypeAndDateRange(
                FinancialTransaction.TransactionType.PG_SETTLEMENT, startDateTime, endDateTime);
        BigDecimal orgSettlements = transactionRepository.sumAmountByTypeAndDateRange(
                FinancialTransaction.TransactionType.ORG_SETTLEMENT, startDateTime, endDateTime);

        Long donationCount = transactionRepository.countByTypeAndDateRange(
                FinancialTransaction.TransactionType.DONATION, startDateTime, endDateTime);
        Long settlementCount = transactionRepository.countByTypeAndDateRange(
                FinancialTransaction.TransactionType.ORG_SETTLEMENT, startDateTime, endDateTime);

        return FinanceDashboardDto.PeriodSummary.builder()
                .donations(donations != null ? donations : BigDecimal.ZERO)
                .pgSettlements(pgSettlements != null ? pgSettlements : BigDecimal.ZERO)
                .orgSettlements(orgSettlements != null ? orgSettlements : BigDecimal.ZERO)
                .platformFees(BigDecimal.ZERO) // 별도 계산 필요 시 추가
                .donationCount(donationCount != null ? donationCount : 0L)
                .settlementCount(settlementCount != null ? settlementCount : 0L)
                .build();
    }

    /**
     * 일별 보고서 조회
     */
    public List<FinanceDashboardDto.DailyReport> getDailyReports(LocalDate startDate, LocalDate endDate) {
        List<FinanceDashboardDto.DailyReport> reports = new ArrayList<>();

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            LocalDateTime startOfDay = currentDate.atStartOfDay();
            LocalDateTime endOfDay = currentDate.plusDays(1).atStartOfDay();

            BigDecimal donationAmount = transactionRepository.sumAmountByTypeAndDateRange(
                    FinancialTransaction.TransactionType.DONATION, startOfDay, endOfDay);
            Long donationCount = transactionRepository.countByTypeAndDateRange(
                    FinancialTransaction.TransactionType.DONATION, startOfDay, endOfDay);
            BigDecimal pgSettlementAmount = transactionRepository.sumAmountByTypeAndDateRange(
                    FinancialTransaction.TransactionType.PG_SETTLEMENT, startOfDay, endOfDay);
            BigDecimal orgSettlementAmount = transactionRepository.sumAmountByTypeAndDateRange(
                    FinancialTransaction.TransactionType.ORG_SETTLEMENT, startOfDay, endOfDay);

            BigDecimal deposits = ledgerRepository.sumDepositsByDateRange(startOfDay, endOfDay);
            BigDecimal withdrawals = ledgerRepository.sumWithdrawalsByDateRange(startOfDay, endOfDay);
            BigDecimal netChange = (deposits != null ? deposits : BigDecimal.ZERO)
                    .subtract(withdrawals != null ? withdrawals : BigDecimal.ZERO);

            reports.add(FinanceDashboardDto.DailyReport.builder()
                    .date(currentDate)
                    .donationAmount(donationAmount != null ? donationAmount : BigDecimal.ZERO)
                    .donationCount(donationCount != null ? donationCount.intValue() : 0)
                    .pgSettlementAmount(pgSettlementAmount != null ? pgSettlementAmount : BigDecimal.ZERO)
                    .orgSettlementAmount(orgSettlementAmount != null ? orgSettlementAmount : BigDecimal.ZERO)
                    .platformFeeAmount(BigDecimal.ZERO)
                    .netChange(netChange)
                    .closingBalance(BigDecimal.ZERO) // 별도 계산 필요
                    .build());

            currentDate = currentDate.plusDays(1);
        }

        return reports;
    }

    /**
     * PG사별 현황 조회
     */
    public List<FinanceDashboardDto.PgProviderSummary> getPgProviderSummaries() {
        List<FinanceDashboardDto.PgProviderSummary> summaries = new ArrayList<>();

        for (PgSettlement.PgProvider provider : PgSettlement.PgProvider.values()) {
            BigDecimal totalSettlements = pgSettlementRepository.sumNetSettlementAmountByProvider(provider);

            summaries.add(FinanceDashboardDto.PgProviderSummary.builder()
                    .pgProvider(provider.name())
                    .totalTransactions(BigDecimal.ZERO) // 별도 쿼리 필요
                    .totalFees(BigDecimal.ZERO) // 별도 쿼리 필요
                    .totalSettlements(totalSettlements != null ? totalSettlements : BigDecimal.ZERO)
                    .transactionCount(0L)
                    .averageFeeRate(new BigDecimal("0.03"))
                    .build());
        }

        return summaries;
    }

    /**
     * 알림 목록 조회
     */
    public List<FinanceDashboardDto.AlertItem> getAlerts() {
        List<FinanceDashboardDto.AlertItem> alerts = new ArrayList<>();

        // 불일치 정산 알림
        List<PgSettlement> mismatchedSettlements = pgSettlementRepository
                .findByStatusOrderBySettlementDateDesc(PgSettlement.PgSettlementStatus.MISMATCH);
        for (PgSettlement settlement : mismatchedSettlements) {
            alerts.add(FinanceDashboardDto.AlertItem.builder()
                    .type(FinanceDashboardDto.AlertType.MISMATCH)
                    .message(String.format("%s 정산 금액 불일치: %s원 차이",
                            settlement.getPgProvider(), settlement.getDifferenceAmount()))
                    .entityType("PgSettlement")
                    .entityId(settlement.getPgSettlementId())
                    .date(settlement.getSettlementDate())
                    .build());
        }

        // 대기중인 기관 정산 알림
        long pendingOrgSettlements = settlementRepository.countByStatus(
                com.wenect.donation_paltform.domain.settlement.entity.Settlement.SettlementStatus.PENDING);
        if (pendingOrgSettlements > 0) {
            alerts.add(FinanceDashboardDto.AlertItem.builder()
                    .type(FinanceDashboardDto.AlertType.PENDING_APPROVAL)
                    .message(String.format("승인 대기중인 기관 정산: %d건", pendingOrgSettlements))
                    .entityType("Settlement")
                    .entityId(null)
                    .date(LocalDate.now())
                    .build());
        }

        return alerts;
    }

    /**
     * 대시보드 전체 응답 조회
     */
    public FinanceDashboardDto.DashboardResponse getDashboard() {
        Long primaryAccountId = accountService.getPrimaryAccountId();

        // 최근 원장 기록
        List<PlatformLedgerDto.Response> recentLedgerEntries = ledgerService
                .getLedgerEntries(primaryAccountId, PageRequest.of(0, 10))
                .getContent();

        // 최근 7일 일별 보고서
        List<FinanceDashboardDto.DailyReport> dailyReports = getDailyReports(
                LocalDate.now().minusDays(7), LocalDate.now());

        return FinanceDashboardDto.DashboardResponse.builder()
                .summary(getSummary())
                .recentDailyReports(dailyReports)
                .pgProviderSummaries(getPgProviderSummaries())
                .recentLedgerEntries(recentLedgerEntries)
                .alerts(getAlerts())
                .build();
    }
}
