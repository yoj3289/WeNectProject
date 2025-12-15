package com.wenect.donation_paltform.domain.finance.dto;

import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerCategory;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PlatformLedgerDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long ledgerId;
        private Long platformAccountId;
        private LedgerType ledgerType;
        private LedgerCategory category;
        private BigDecimal amount;
        private BigDecimal balanceBefore;
        private BigDecimal balanceAfter;
        private String referenceType;
        private Long referenceId;
        private Long projectId;
        private Long organizationId;
        private String description;
        private Long performedBy;
        private String performedByType;
        private LocalDateTime createdAt;

        public static Response from(PlatformLedger ledger) {
            return Response.builder()
                    .ledgerId(ledger.getLedgerId())
                    .platformAccountId(ledger.getPlatformAccountId())
                    .ledgerType(ledger.getLedgerType())
                    .category(ledger.getCategory())
                    .amount(ledger.getAmount())
                    .balanceBefore(ledger.getBalanceBefore())
                    .balanceAfter(ledger.getBalanceAfter())
                    .referenceType(ledger.getReferenceType())
                    .referenceId(ledger.getReferenceId())
                    .projectId(ledger.getProjectId())
                    .organizationId(ledger.getOrganizationId())
                    .description(ledger.getDescription())
                    .performedBy(ledger.getPerformedBy())
                    .performedByType(ledger.getPerformedByType())
                    .createdAt(ledger.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryResponse {
        private BigDecimal totalDeposits;
        private BigDecimal totalWithdrawals;
        private BigDecimal currentBalance;
        private BigDecimal platformFeeEarned;
        private BigDecimal pgFeesPaid;
        private BigDecimal orgSettlementsPaid;
        private Long transactionCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateAdjustmentRequest {
        private LedgerType ledgerType;
        private BigDecimal amount;
        private String description;
        private String reason;
    }
}
