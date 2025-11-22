package com.wenect.donation_paltform.domain.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 정산 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementRequestDto {

    private Long projectId;
    private BigDecimal settlementAmount; // 정산 신청 금액
    private String bankName;             // 입금 은행명
    private String accountNumber;        // 입금 계좌번호
    private String accountHolder;        // 예금주명
}
