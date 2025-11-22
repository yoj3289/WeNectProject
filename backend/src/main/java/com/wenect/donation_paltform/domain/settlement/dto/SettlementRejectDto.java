package com.wenect.donation_paltform.domain.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 정산 반려 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementRejectDto {

    private String rejectionReason; // 반려 사유 (필수)
}
