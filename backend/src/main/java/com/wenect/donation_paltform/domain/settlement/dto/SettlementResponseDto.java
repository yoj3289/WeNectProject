package com.wenect.donation_paltform.domain.settlement.dto;

import com.wenect.donation_paltform.domain.settlement.entity.Settlement;
import com.wenect.donation_paltform.global.converter.AccountNumberConverter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 정산 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementResponseDto {

    private Long settlementId;
    private Long projectId;
    private String projectTitle; // 프로젝트 제목 (조인 필요)
    private Long piggyId;
    private BigDecimal settlementAmount;
    private String bankName;
    private String accountNumber;
    private String maskedAccountNumber; // 마스킹된 계좌번호 (외부 노출용)
    private String accountHolder;
    private String status; // PENDING, APPROVED, COMPLETED, REJECTED
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;
    private String rejectionReason;
    private String adminMemo;
    private List<SettlementDocumentDto> documents;

    /**
     * Entity -> DTO 변환
     */
    public static SettlementResponseDto fromEntity(Settlement settlement) {
        String accountNumber = settlement.getAccountNumber();
        return SettlementResponseDto.builder()
            .settlementId(settlement.getSettlementId())
            .projectId(settlement.getProjectId())
            .piggyId(settlement.getPiggyId())
            .settlementAmount(settlement.getSettlementAmount())
            .bankName(settlement.getBankName())
            .accountNumber(accountNumber)
            .maskedAccountNumber(AccountNumberConverter.maskAccountNumber(accountNumber))
            .accountHolder(settlement.getAccountHolder())
            .status(settlement.getStatus().name())
            .requestedAt(settlement.getRequestedAt())
            .approvedAt(settlement.getApprovedAt())
            .completedAt(settlement.getCompletedAt())
            .rejectionReason(settlement.getRejectionReason())
            .adminMemo(settlement.getAdminMemo())
            .documents(settlement.getDocuments().stream()
                .map(SettlementDocumentDto::fromEntity)
                .collect(Collectors.toList()))
            .build();
    }

    /**
     * Entity -> DTO 변환 (프로젝트 제목 포함)
     */
    public static SettlementResponseDto fromEntityWithProject(Settlement settlement, String projectTitle) {
        SettlementResponseDto dto = fromEntity(settlement);
        dto.setProjectTitle(projectTitle);
        return dto;
    }
}
