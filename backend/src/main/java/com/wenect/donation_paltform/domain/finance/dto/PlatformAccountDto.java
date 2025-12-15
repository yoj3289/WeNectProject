package com.wenect.donation_paltform.domain.finance.dto;

import com.wenect.donation_paltform.domain.finance.entity.PlatformAccount;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PlatformAccountDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String accountName;
        private String bankName;
        private String accountNumber;
        private String accountHolder;
        private BigDecimal platformFeeRate;
        private BigDecimal pgFeeRate;
        private String description;
        private Boolean isPrimary;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String accountName;
        private String bankName;
        private String accountNumber;
        private String accountHolder;
        private BigDecimal platformFeeRate;
        private BigDecimal pgFeeRate;
        private String description;
        private Boolean isActive;
        private Boolean isPrimary;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long accountId;
        private String accountName;
        private String bankName;
        private String maskedAccountNumber;  // 마스킹된 계좌번호
        private String accountHolder;
        private BigDecimal platformFeeRate;
        private BigDecimal pgFeeRate;
        private Boolean isActive;
        private Boolean isPrimary;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private BigDecimal currentBalance;  // 현재 잔액

        public static Response from(PlatformAccount account, BigDecimal currentBalance) {
            return Response.builder()
                    .accountId(account.getAccountId())
                    .accountName(account.getAccountName())
                    .bankName(account.getBankName())
                    .maskedAccountNumber(maskAccountNumber(account.getAccountNumber()))
                    .accountHolder(account.getAccountHolder())
                    .platformFeeRate(account.getPlatformFeeRate())
                    .pgFeeRate(account.getPgFeeRate())
                    .isActive(account.getIsActive())
                    .isPrimary(account.getIsPrimary())
                    .description(account.getDescription())
                    .createdAt(account.getCreatedAt())
                    .updatedAt(account.getUpdatedAt())
                    .currentBalance(currentBalance)
                    .build();
        }

        private static String maskAccountNumber(String accountNumber) {
            if (accountNumber == null || accountNumber.length() < 4) {
                return "****";
            }
            int visibleLength = 4;
            String masked = "*".repeat(accountNumber.length() - visibleLength);
            return masked + accountNumber.substring(accountNumber.length() - visibleLength);
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetailResponse {
        private Long accountId;
        private String accountName;
        private String bankName;
        private String accountNumber;  // 전체 계좌번호 (관리자용)
        private String accountHolder;
        private BigDecimal platformFeeRate;
        private BigDecimal pgFeeRate;
        private Boolean isActive;
        private Boolean isPrimary;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long createdBy;
        private BigDecimal currentBalance;

        public static DetailResponse from(PlatformAccount account, BigDecimal currentBalance) {
            return DetailResponse.builder()
                    .accountId(account.getAccountId())
                    .accountName(account.getAccountName())
                    .bankName(account.getBankName())
                    .accountNumber(account.getAccountNumber())
                    .accountHolder(account.getAccountHolder())
                    .platformFeeRate(account.getPlatformFeeRate())
                    .pgFeeRate(account.getPgFeeRate())
                    .isActive(account.getIsActive())
                    .isPrimary(account.getIsPrimary())
                    .description(account.getDescription())
                    .createdAt(account.getCreatedAt())
                    .updatedAt(account.getUpdatedAt())
                    .createdBy(account.getCreatedBy())
                    .currentBalance(currentBalance)
                    .build();
        }
    }
}
