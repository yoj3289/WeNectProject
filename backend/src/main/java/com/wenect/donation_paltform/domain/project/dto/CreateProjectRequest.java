package com.wenect.donation_paltform.domain.project.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProjectRequest {

    @NotBlank(message = "프로젝트 제목은 필수입니다")
    @Size(max = 200, message = "프로젝트 제목은 200자 이하여야 합니다")
    private String title;

    @NotBlank(message = "카테고리는 필수입니다")
    private String category; // "아동복지", "노인복지" 등

    @NotBlank(message = "프로젝트 설명은 필수입니다")
    private String description;

    @NotNull(message = "목표 금액은 필수입니다")
    @DecimalMin(value = "1000000", message = "목표 금액은 최소 100만원 이상이어야 합니다")
    private BigDecimal targetAmount;

    @NotBlank(message = "시작일은 필수입니다")
    private String startDate; // "2025-01-01" 형식

    @NotBlank(message = "종료일은 필수입니다")
    private String endDate; // "2025-12-31" 형식

    // 기부금 사용계획 (필수) - 사용자에게 공개되는 간단한 설명
    @NotBlank(message = "기부금 사용계획은 필수입니다")
    private String budgetPlan;

    // 계획서 파일 공개 여부 (선택, 기본값: true)
    private Boolean isPlanPublic;

    // 기부 옵션 리스트 (필수, 최소 1개)
    @NotNull(message = "기부 옵션은 필수입니다")
    @Size(min = 1, max = 10, message = "기부 옵션은 최소 1개, 최대 10개까지 등록 가능합니다")
    private List<DonationOptionDto> donationOptions;
}
