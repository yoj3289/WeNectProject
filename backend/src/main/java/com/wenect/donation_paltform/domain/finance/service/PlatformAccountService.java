package com.wenect.donation_paltform.domain.finance.service;

import com.wenect.donation_paltform.domain.finance.dto.PlatformAccountDto;
import com.wenect.donation_paltform.domain.finance.entity.FinancialAuditLog;
import com.wenect.donation_paltform.domain.finance.entity.PlatformAccount;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger;
import com.wenect.donation_paltform.domain.finance.repository.FinancialAuditLogRepository;
import com.wenect.donation_paltform.domain.finance.repository.PlatformAccountRepository;
import com.wenect.donation_paltform.domain.finance.repository.PlatformLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * 플랫폼 계좌 관리 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlatformAccountService {

    private final PlatformAccountRepository accountRepository;
    private final PlatformLedgerRepository ledgerRepository;
    private final FinancialAuditLogRepository auditLogRepository;

    /**
     * 플랫폼 계좌 생성
     */
    public PlatformAccountDto.Response createAccount(PlatformAccountDto.CreateRequest request, Long createdBy) {
        // 주 계좌로 설정하는 경우 기존 주 계좌 해제
        if (Boolean.TRUE.equals(request.getIsPrimary())) {
            accountRepository.findByIsPrimaryTrueAndIsActiveTrue()
                    .ifPresent(existingPrimary -> {
                        existingPrimary.unsetAsPrimary();
                        accountRepository.save(existingPrimary);
                    });
        }

        PlatformAccount account = PlatformAccount.builder()
                .accountName(request.getAccountName())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountHolder(request.getAccountHolder())
                .platformFeeRate(request.getPlatformFeeRate() != null
                        ? request.getPlatformFeeRate() : new BigDecimal("0.02"))
                .pgFeeRate(request.getPgFeeRate() != null
                        ? request.getPgFeeRate() : new BigDecimal("0.03"))
                .description(request.getDescription())
                .isPrimary(Boolean.TRUE.equals(request.getIsPrimary()))
                .isActive(true)
                .createdBy(createdBy)
                .build();

        PlatformAccount savedAccount = accountRepository.save(account);

        // 감사 로그
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.CREATE)
                .entityType("PlatformAccount")
                .entityId(savedAccount.getAccountId())
                .performedBy(createdBy)
                .performedByRole(FinancialAuditLog.PerformerRole.ADMIN)
                .description("플랫폼 계좌 생성: " + savedAccount.getAccountName())
                .build();
        auditLogRepository.save(auditLog);

        log.info("Platform account created: id={}, name={}", savedAccount.getAccountId(), savedAccount.getAccountName());

        return PlatformAccountDto.Response.from(savedAccount, BigDecimal.ZERO);
    }

    /**
     * 플랫폼 계좌 수정
     */
    public PlatformAccountDto.Response updateAccount(Long accountId, PlatformAccountDto.UpdateRequest request, Long updatedBy) {
        PlatformAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));

        // 주 계좌로 설정하는 경우 기존 주 계좌 해제
        if (Boolean.TRUE.equals(request.getIsPrimary()) && !Boolean.TRUE.equals(account.getIsPrimary())) {
            accountRepository.findByIsPrimaryTrueAndIsActiveTrue()
                    .ifPresent(existingPrimary -> {
                        if (!existingPrimary.getAccountId().equals(accountId)) {
                            existingPrimary.unsetAsPrimary();
                            accountRepository.save(existingPrimary);
                        }
                    });
        }

        if (request.getAccountName() != null) account.setAccountName(request.getAccountName());
        if (request.getBankName() != null) account.setBankName(request.getBankName());
        if (request.getAccountNumber() != null) account.setAccountNumber(request.getAccountNumber());
        if (request.getAccountHolder() != null) account.setAccountHolder(request.getAccountHolder());
        if (request.getPlatformFeeRate() != null) account.setPlatformFeeRate(request.getPlatformFeeRate());
        if (request.getPgFeeRate() != null) account.setPgFeeRate(request.getPgFeeRate());
        if (request.getDescription() != null) account.setDescription(request.getDescription());
        if (request.getIsActive() != null) account.setIsActive(request.getIsActive());
        if (request.getIsPrimary() != null) account.setIsPrimary(request.getIsPrimary());

        PlatformAccount savedAccount = accountRepository.save(account);

        // 감사 로그
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.UPDATE)
                .entityType("PlatformAccount")
                .entityId(savedAccount.getAccountId())
                .performedBy(updatedBy)
                .performedByRole(FinancialAuditLog.PerformerRole.ADMIN)
                .description("플랫폼 계좌 수정: " + savedAccount.getAccountName())
                .build();
        auditLogRepository.save(auditLog);

        BigDecimal currentBalance = getCurrentBalance(accountId);
        return PlatformAccountDto.Response.from(savedAccount, currentBalance);
    }

    /**
     * 플랫폼 계좌 조회
     */
    @Transactional(readOnly = true)
    public PlatformAccountDto.DetailResponse getAccount(Long accountId) {
        PlatformAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));

        BigDecimal currentBalance = getCurrentBalance(accountId);
        return PlatformAccountDto.DetailResponse.from(account, currentBalance);
    }

    /**
     * 활성 계좌 목록 조회
     */
    @Transactional(readOnly = true)
    public List<PlatformAccountDto.Response> getActiveAccounts() {
        return accountRepository.findByIsActiveTrue().stream()
                .map(account -> PlatformAccountDto.Response.from(account, getCurrentBalance(account.getAccountId())))
                .toList();
    }

    /**
     * 주 계좌 조회
     */
    @Transactional(readOnly = true)
    public PlatformAccountDto.Response getPrimaryAccount() {
        PlatformAccount account = accountRepository.findByIsPrimaryTrueAndIsActiveTrue()
                .orElseGet(() -> {
                    // 주 계좌가 없으면 첫 번째 활성 계좌 반환
                    List<PlatformAccount> accounts = accountRepository.findActiveAccountsOrderByPrimary();
                    if (accounts.isEmpty()) {
                        throw new IllegalStateException("활성화된 플랫폼 계좌가 없습니다.");
                    }
                    return accounts.get(0);
                });

        BigDecimal currentBalance = getCurrentBalance(account.getAccountId());
        return PlatformAccountDto.Response.from(account, currentBalance);
    }

    /**
     * 주 계좌 ID 조회 (내부용)
     */
    @Transactional(readOnly = true)
    public Long getPrimaryAccountId() {
        return accountRepository.findByIsPrimaryTrueAndIsActiveTrue()
                .map(PlatformAccount::getAccountId)
                .orElseGet(() -> {
                    List<PlatformAccount> accounts = accountRepository.findActiveAccountsOrderByPrimary();
                    if (accounts.isEmpty()) {
                        throw new IllegalStateException("활성화된 플랫폼 계좌가 없습니다.");
                    }
                    return accounts.get(0).getAccountId();
                });
    }

    /**
     * 계좌 비활성화
     */
    public void deactivateAccount(Long accountId, Long performedBy) {
        PlatformAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));

        // 주 계좌는 비활성화 불가
        if (Boolean.TRUE.equals(account.getIsPrimary())) {
            throw new IllegalStateException("주 계좌는 비활성화할 수 없습니다. 먼저 다른 계좌를 주 계좌로 설정하세요.");
        }

        account.deactivate();
        accountRepository.save(account);

        // 감사 로그
        FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.UPDATE)
                .entityType("PlatformAccount")
                .entityId(accountId)
                .performedBy(performedBy)
                .performedByRole(FinancialAuditLog.PerformerRole.ADMIN)
                .description("플랫폼 계좌 비활성화: " + account.getAccountName())
                .build();
        auditLogRepository.save(auditLog);

        log.info("Platform account deactivated: id={}", accountId);
    }

    /**
     * 현재 잔액 조회
     */
    private BigDecimal getCurrentBalance(Long accountId) {
        return ledgerRepository.findTopByPlatformAccountIdOrderByCreatedAtDesc(accountId)
                .map(PlatformLedger::getBalanceAfter)
                .orElse(BigDecimal.ZERO);
    }

    /**
     * 수수료율 조회
     * NOTE: 위넥트 플랫폼은 수수료를 받지 않음 (항상 0%)
     */
    @Transactional(readOnly = true)
    public BigDecimal getPlatformFeeRate() {
        return BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getPgFeeRate() {
        return BigDecimal.ZERO;
    }
}
