package com.wenect.donation_paltform.domain.piggybank.dto;

import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 저금통 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiggyBankResponseDto {

    private Long piggyId;
    private Long projectId;
    private String projectTitle; // 프로젝트 제목 (조인 필요)
    private BigDecimal totalAmount;      // 총 보관금액
    private BigDecimal withdrawnAmount;  // 인출금액
    private BigDecimal balance;          // 잔액
    private String status;               // ACTIVE, WITHDRAWN, LOCKED
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static PiggyBankResponseDto fromEntity(PiggyBank piggyBank) {
        return PiggyBankResponseDto.builder()
            .piggyId(piggyBank.getPiggyId())
            .projectId(piggyBank.getProjectId())
            .totalAmount(piggyBank.getTotalAmount())
            .withdrawnAmount(piggyBank.getWithdrawnAmount())
            .balance(piggyBank.getBalance())
            .status(piggyBank.getStatus().name())
            .lastUpdated(piggyBank.getLastUpdated())
            .createdAt(piggyBank.getCreatedAt())
            .build();
    }

    /**
     * Entity -> DTO 변환 (프로젝트 제목 포함)
     */
    public static PiggyBankResponseDto fromEntityWithProject(PiggyBank piggyBank, String projectTitle) {
        PiggyBankResponseDto dto = fromEntity(piggyBank);
        dto.setProjectTitle(projectTitle);
        return dto;
    }
}
