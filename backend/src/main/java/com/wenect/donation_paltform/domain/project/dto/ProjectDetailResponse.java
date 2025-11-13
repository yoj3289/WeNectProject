package com.wenect.donation_paltform.domain.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.entity.ProjectDocument;
import com.wenect.donation_paltform.domain.project.entity.ProjectImage;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDetailResponse {

    @JsonProperty("id")
    private Long projectId;

    private Long userId; // 프로젝트 작성자 ID

    private String title;

    @JsonProperty("category")
    private String categoryName;

    private BigDecimal currentAmount;
    private BigDecimal targetAmount;

    @JsonProperty("dday")
    private Long dday;

    @JsonProperty("donors")
    private Integer donorCount;

    @JsonProperty("image")
    private String image; // 대표 이미지

    private String description;
    private String status;
    private String rejectionReason;
    private LocalDate startDate;
    private LocalDate endDate;

    private OrganizationInfo organization;
    private List<ImageInfo> images;
    private List<DocumentInfo> documents;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrganizationInfo {
        private Long organizationId;
        private String name;
        private String introduction;
        private String websiteUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageInfo {
        private Long imageId;
        private String imageUrl;
        private String caption;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentInfo {
        private Long documentId;
        private String fileName;
        private String fileUrl;
        private Long fileSize;
    }

    /**
     * Entity들로부터 상세 응답 생성
     */
    public static ProjectDetailResponse from(
            Project project,
            String categoryName,
            Organization organization,
            List<ProjectImage> projectImages,
            List<ProjectDocument> projectDocuments) {

        // D-day 계산
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), project.getEndDate());

        // 대표 이미지 설정
        String representativeImage = (projectImages != null && !projectImages.isEmpty())
                ? projectImages.get(0).getFilePath()
                : "";

        // 기관 정보 변환
        OrganizationInfo orgInfo = OrganizationInfo.builder()
                .organizationId(organization.getOrgId())
                .name(organization.getOrgName())
                .introduction("기관 소개") // TODO: Organization 엔티티에 introduction 필드 추가
                .websiteUrl(null) // TODO: Organization 엔티티에 websiteUrl 필드 추가
                .build();

        // 이미지 정보 변환
        List<ImageInfo> imageInfos = (projectImages != null && !projectImages.isEmpty())
                ? projectImages.stream()
                        .map(img -> ImageInfo.builder()
                                .imageId(img.getImageId())
                                .imageUrl(img.getFilePath())
                                .caption(null) // TODO: caption 필드 추가 시 사용
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        // 문서 정보 변환
        List<DocumentInfo> documentInfos = (projectDocuments != null && !projectDocuments.isEmpty())
                ? projectDocuments.stream()
                        .map(doc -> DocumentInfo.builder()
                                .documentId(doc.getDocumentId())
                                .fileName(doc.getFileName())
                                .fileUrl(doc.getFilePath())
                                .fileSize(doc.getFileSize())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return ProjectDetailResponse.builder()
                .projectId(project.getProjectId())
                .userId(organization.getUser().getUserId()) // 작성자 ID (Organization의 User)
                .title(project.getTitle())
                .categoryName(categoryName)
                .currentAmount(project.getCurrentAmount())
                .targetAmount(project.getTargetAmount())
                .dday(daysLeft)
                .donorCount(project.getDonorCount())
                .image(representativeImage)
                .description(project.getDescription())
                .status(project.getStatus().name())
                .rejectionReason(null) // TODO: rejection_reason 필드 추가 시 사용
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .organization(orgInfo)
                .images(imageInfos)
                .documents(documentInfos)
                .build();
    }
}
