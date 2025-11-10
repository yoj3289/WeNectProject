package com.wenect.donation_paltform.domain.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.wenect.donation_paltform.domain.project.entity.Project;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    // 프론트엔드 호환성을 위한 필드명 매핑
    @JsonProperty("id")
    private Long projectId;

    private Long orgId;
    private Integer categoryId;

    @JsonProperty("category")
    private String categoryName; // 프론트엔드 표시용

    private String title;
    private String description;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;

    @JsonProperty("donors")
    private Integer donorCount;

    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonProperty("image")
    private String image; // 대표 이미지 (첫 번째 이미지)

    private List<String> imageUrls; // 전체 이미지 URL 목록

    @JsonProperty("dday")
    private Long dday; // D-day 계산

    @JsonProperty("organization")
    private String organization; // 기관명 (나중에 JOIN으로 가져올 예정)

    /**
     * Entity -> DTO 변환
     */
    public static ProjectResponse from(Project project, String categoryName, List<String> imageUrls) {
        // D-day 계산 (오늘 ~ 종료일)
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), project.getEndDate());

        // 대표 이미지 설정 (첫 번째 이미지 또는 빈 문자열)
        String representativeImage = (imageUrls != null && !imageUrls.isEmpty())
            ? imageUrls.get(0)
            : "";

        return ProjectResponse.builder()
                .projectId(project.getProjectId())
                .orgId(project.getOrgId())
                .categoryId(project.getCategoryId())
                .categoryName(categoryName)
                .title(project.getTitle())
                .description(project.getDescription())
                .targetAmount(project.getTargetAmount())
                .currentAmount(project.getCurrentAmount())
                .donorCount(project.getDonorCount())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus().name())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .imageUrls(imageUrls)
                .image(representativeImage)
                .dday(daysLeft)
                .organization("기관명") // TODO: Organization JOIN으로 실제 기관명 가져오기
                .build();
    }
}
