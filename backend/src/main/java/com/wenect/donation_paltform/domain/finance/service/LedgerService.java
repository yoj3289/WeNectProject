package com.wenect.donation_paltform.domain.finance.service;

import com.wenect.donation_paltform.domain.finance.dto.PlatformLedgerDto;
import com.wenect.donation_paltform.domain.finance.entity.FinancialAuditLog;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerCategory;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerType;
import com.wenect.donation_paltform.domain.finance.repository.FinancialAuditLogRepository;
import com.wenect.donation_paltform.domain.finance.repository.PlatformLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 원장(Ledger) 서비스
 * 플랫폼의 모든 입출금 내역을 관리하고 무결성을 보장
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LedgerService {

    private final PlatformLedgerRepository ledgerRepository;
    private final FinancialAuditLogRepository auditLogRepository;

    /**
     * 입금 기록 생성
     */
    public PlatformLedger recordDeposit(
            Long platformAccountId,
            LedgerCategory category,
            BigDecimal amount,
            String referenceType,
            Long referenceId,
            String description,
            Long projectId,
            Long organizationId,
            Long performedBy,
            String performedByType
    ) {
        // 현재 잔액 조회
        BigDecimal currentBalance = getCurrentBalance(platformAccountId);

        // 이전 해시 조회
        String previousHash = ledgerRepository.findLatestHashByAccountId(platformAccountId)
                .orElse("GENESIS");

        // 원장 기록 생성
        PlatformLedger ledger = PlatformLedger.createDeposit(
                platformAccountId,
                category,
                amount,
                currentBalance,
                referenceType,
                referenceId,
                description,
                previousHash
        );

        ledger.setProjectId(projectId);
        ledger.setOrganizationId(organizationId);
        ledger.setPerformedBy(performedBy);
        ledger.setPerformedByType(performedByType != null ? performedByType : "SYSTEM");

        // 해시 생성
        String transactionHash = generateTransactionHash(ledger, previousHash);
        ledger.setTransactionHash(transactionHash);

        PlatformLedger savedLedger = ledgerRepository.save(ledger);

        log.info("Ledger deposit recorded: accountId={}, amount={}, newBalance={}, category={}",
                platformAccountId, amount, ledger.getBalanceAfter(), category);

        return savedLedger;
    }

    /**
     * 출금 기록 생성
     */
    public PlatformLedger recordWithdrawal(
            Long platformAccountId,
            LedgerCategory category,
            BigDecimal amount,
            String referenceType,
            Long referenceId,
            String description,
            Long projectId,
            Long organizationId,
            Long performedBy,
            String performedByType
    ) {
        // 현재 잔액 조회
        BigDecimal currentBalance = getCurrentBalance(platformAccountId);

        // 잔액 부족 검증
        if (currentBalance.compareTo(amount) < 0) {
            log.error("Insufficient balance: current={}, requested={}", currentBalance, amount);
            throw new IllegalStateException("잔액이 부족합니다. 현재 잔액: " + currentBalance + ", 요청 금액: " + amount);
        }

        // 이전 해시 조회
        String previousHash = ledgerRepository.findLatestHashByAccountId(platformAccountId)
                .orElse("GENESIS");

        // 원장 기록 생성
        PlatformLedger ledger = PlatformLedger.createWithdrawal(
                platformAccountId,
                category,
                amount,
                currentBalance,
                referenceType,
                referenceId,
                description,
                previousHash
        );

        ledger.setProjectId(projectId);
        ledger.setOrganizationId(organizationId);
        ledger.setPerformedBy(performedBy);
        ledger.setPerformedByType(performedByType != null ? performedByType : "SYSTEM");

        // 해시 생성
        String transactionHash = generateTransactionHash(ledger, previousHash);
        ledger.setTransactionHash(transactionHash);

        PlatformLedger savedLedger = ledgerRepository.save(ledger);

        log.info("Ledger withdrawal recorded: accountId={}, amount={}, newBalance={}, category={}",
                platformAccountId, amount, ledger.getBalanceAfter(), category);

        return savedLedger;
    }

    /**
     * 현재 잔액 조회
     */
    @Transactional(readOnly = true)
    public BigDecimal getCurrentBalance(Long platformAccountId) {
        return ledgerRepository.findTopByPlatformAccountIdOrderByCreatedAtDesc(platformAccountId)
                .map(PlatformLedger::getBalanceAfter)
                .orElse(BigDecimal.ZERO);
    }

    /**
     * 원장 기록 페이징 조회
     */
    @Transactional(readOnly = true)
    public Page<PlatformLedgerDto.Response> getLedgerEntries(Long platformAccountId, Pageable pageable) {
        return ledgerRepository.findByPlatformAccountIdOrderByCreatedAtDesc(platformAccountId, pageable)
                .map(PlatformLedgerDto.Response::from);
    }

    /**
     * 유형별 원장 기록 조회
     */
    @Transactional(readOnly = true)
    public Page<PlatformLedgerDto.Response> getLedgerEntriesByType(LedgerType type, Pageable pageable) {
        return ledgerRepository.findByLedgerTypeOrderByCreatedAtDesc(type, pageable)
                .map(PlatformLedgerDto.Response::from);
    }

    /**
     * 카테고리별 원장 기록 조회
     */
    @Transactional(readOnly = true)
    public Page<PlatformLedgerDto.Response> getLedgerEntriesByCategory(LedgerCategory category, Pageable pageable) {
        return ledgerRepository.findByCategoryOrderByCreatedAtDesc(category, pageable)
                .map(PlatformLedgerDto.Response::from);
    }

    /**
     * 프로젝트별 원장 기록 조회
     */
    @Transactional(readOnly = true)
    public List<PlatformLedgerDto.Response> getLedgerEntriesByProject(Long projectId) {
        return ledgerRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(PlatformLedgerDto.Response::from)
                .toList();
    }

    /**
     * 기관별 원장 기록 조회
     */
    @Transactional(readOnly = true)
    public List<PlatformLedgerDto.Response> getLedgerEntriesByOrganization(Long organizationId) {
        return ledgerRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId).stream()
                .map(PlatformLedgerDto.Response::from)
                .toList();
    }

    /**
     * 원장 요약 정보 조회
     */
    @Transactional(readOnly = true)
    public PlatformLedgerDto.SummaryResponse getLedgerSummary(Long platformAccountId) {
        LocalDateTime startOfTime = LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime now = LocalDateTime.now();

        BigDecimal totalDeposits = ledgerRepository.sumDepositsByDateRange(startOfTime, now);
        BigDecimal totalWithdrawals = ledgerRepository.sumWithdrawalsByDateRange(startOfTime, now);
        BigDecimal currentBalance = getCurrentBalance(platformAccountId);
        BigDecimal platformFeeEarned = ledgerRepository.sumAmountByCategory(LedgerCategory.PLATFORM_FEE);
        BigDecimal orgSettlementsPaid = ledgerRepository.sumAmountByCategory(LedgerCategory.ORG_SETTLEMENT);

        return PlatformLedgerDto.SummaryResponse.builder()
                .totalDeposits(totalDeposits)
                .totalWithdrawals(totalWithdrawals)
                .currentBalance(currentBalance)
                .platformFeeEarned(platformFeeEarned)
                .orgSettlementsPaid(orgSettlementsPaid)
                .build();
    }

    /**
     * 해시 체인 무결성 검증
     */
    @Transactional(readOnly = true)
    public boolean verifyLedgerIntegrity(Long platformAccountId) {
        List<PlatformLedger> ledgers = ledgerRepository.findByPlatformAccountIdOrderByCreatedAtAsc(platformAccountId);

        if (ledgers.isEmpty()) {
            return true;
        }

        String expectedPreviousHash = "GENESIS";

        for (PlatformLedger ledger : ledgers) {
            // 이전 해시 검증
            if (!expectedPreviousHash.equals(ledger.getPreviousHash())) {
                log.error("Ledger integrity violation: ledgerId={}, expected previous hash={}, actual={}",
                        ledger.getLedgerId(), expectedPreviousHash, ledger.getPreviousHash());
                return false;
            }

            // 현재 해시 재계산 및 검증
            String calculatedHash = generateTransactionHash(ledger, ledger.getPreviousHash());
            if (!calculatedHash.equals(ledger.getTransactionHash())) {
                log.error("Ledger integrity violation: ledgerId={}, hash mismatch", ledger.getLedgerId());
                return false;
            }

            expectedPreviousHash = ledger.getTransactionHash();
        }

        log.info("Ledger integrity verified: accountId={}, entries={}", platformAccountId, ledgers.size());
        return true;
    }

    /**
     * 조정 기록 생성 (관리자용)
     */
    public PlatformLedger recordAdjustment(
            Long platformAccountId,
            LedgerType type,
            BigDecimal amount,
            String description,
            String reason,
            Long performedBy
    ) {
        LedgerCategory category = type == LedgerType.DEPOSIT
                ? LedgerCategory.ADJUSTMENT_PLUS
                : LedgerCategory.ADJUSTMENT_MINUS;

        PlatformLedger ledger;
        if (type == LedgerType.DEPOSIT) {
            ledger = recordDeposit(platformAccountId, category, amount, "Adjustment", null,
                    description, null, null, performedBy, "ADMIN");
        } else {
            ledger = recordWithdrawal(platformAccountId, category, amount, "Adjustment", null,
                    description, null, null, performedBy, "ADMIN");
        }

        // 감사 로그 기록
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.ADJUSTMENT)
                .entityType("PlatformLedger")
                .entityId(ledger.getLedgerId())
                .performedBy(performedBy)
                .performedByRole(FinancialAuditLog.PerformerRole.ADMIN)
                .reason(reason)
                .description(description + " | Amount: " + amount)
                .build();
        auditLogRepository.save(auditLog);

        return ledger;
    }

    /**
     * 거래 해시 생성 (SHA-256)
     */
    private String generateTransactionHash(PlatformLedger ledger, String previousHash) {
        String data = String.format("%s|%s|%s|%s|%s|%s",
                ledger.getPlatformAccountId(),
                ledger.getLedgerType(),
                ledger.getAmount().toPlainString(),
                ledger.getBalanceAfter().toPlainString(),
                ledger.getCreatedAt() != null ? ledger.getCreatedAt().toString() : LocalDateTime.now().toString(),
                previousHash
        );
        return sha256Hex(data);
    }

    /**
     * SHA-256 해시 생성
     */
    private String sha256Hex(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
