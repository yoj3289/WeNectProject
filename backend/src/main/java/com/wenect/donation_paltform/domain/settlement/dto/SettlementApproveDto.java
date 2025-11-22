package com.wenect.donation_paltform.domain.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 정산 승인 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementApproveDto {

    private String adminMemo; // 관리자 메모
}
