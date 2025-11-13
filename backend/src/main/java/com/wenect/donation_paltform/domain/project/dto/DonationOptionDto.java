package com.wenect.donation_paltform.domain.project.dto;

import com.wenect.donation_paltform.domain.project.entity.DonationOption;
import lombok.*;

import java.math.BigDecimal;

/**
 * 기부 옵션 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationOptionDto {

    private Long optionId;
    private Long projectId;
    private String optionName;
    private String optionDescription;
    private BigDecimal amount;
    private String iconEmoji;
    private Integer displayOrder;
    private Boolean isActive;

    /**
     * 엔티티를 DTO로 변환
     */
    public static DonationOptionDto fromEntity(DonationOption entity) {
        return DonationOptionDto.builder()
                .optionId(entity.getOptionId())
                .projectId(entity.getProjectId())
                .optionName(entity.getOptionName())
                .optionDescription(entity.getOptionDescription())
                .amount(entity.getAmount())
                .iconEmoji(entity.getIconEmoji())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .build();
    }

    /**
     * DTO를 엔티티로 변환
     */
    public DonationOption toEntity() {
        return DonationOption.builder()
                .optionId(this.optionId)
                .projectId(this.projectId)
                .optionName(this.optionName)
                .optionDescription(this.optionDescription)
                .amount(this.amount)
                .iconEmoji(this.iconEmoji)
                .displayOrder(this.displayOrder != null ? this.displayOrder : 0)
                .isActive(this.isActive != null ? this.isActive : true)
                .build();
    }
}
