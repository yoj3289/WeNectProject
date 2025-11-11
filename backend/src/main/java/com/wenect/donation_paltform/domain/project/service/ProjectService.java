package com.wenect.donation_paltform.domain.project.service;

import com.wenect.donation_paltform.domain.project.dto.CreateProjectRequest;
import com.wenect.donation_paltform.domain.project.dto.ProjectDetailResponse;
import com.wenect.donation_paltform.domain.project.dto.ProjectResponse;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.entity.ProjectDocument;
import com.wenect.donation_paltform.domain.project.entity.ProjectImage;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.project.repository.ProjectDocumentRepository;
import com.wenect.donation_paltform.domain.project.repository.ProjectImageRepository;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectImageRepository projectImageRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final OrganizationRepository organizationRepository;
    private final com.wenect.donation_paltform.global.service.FileStorageService fileStorageService;
    private final com.wenect.donation_paltform.domain.favorite.service.FavoriteProjectService favoriteProjectService;

    /**
     * 카테고리명 -> category_id 변환 (하드코딩)
     */
    private Integer getCategoryId(String categoryName) {
        switch (categoryName) {
            case "아동복지":
                return 1;
            case "노인복지":
                return 2;
            case "장애인복지":
                return 3;
            case "동물보호":
                return 4;
            case "환경보호":
                return 5;
            case "교육":
                return 6;
            default:
                throw new IllegalArgumentException("유효하지 않은 카테고리: " + categoryName);
        }
    }

    /**
     * category_id -> 카테고리명 변환 (하드코딩)
     */
    private String getCategoryName(Integer categoryId) {
        switch (categoryId) {
            case 1:
                return "Child Welfare";
            case 2:
                return "Elder Care";
            case 3:
                return "Disability Support";
            case 4:
                return "Animal Protection";
            case 5:
                return "Environment";
            case 6:
                return "Education";
            default:
                return "Others";
        }
    }

    /**
     * 프로젝트 생성
     */
    @Transactional
    public ProjectResponse createProject(
            Long userId,
            CreateProjectRequest request,
            List<MultipartFile> images,
            MultipartFile planDocument) throws IOException {

        // 1. 사용자의 기관 정보 조회
        Organization organization = organizationRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalStateException("기관 회원만 프로젝트를 등록할 수 있습니다"));

        // 2. 카테고리명 -> ID 변환
        Integer categoryId = getCategoryId(request.getCategory());

        // 3. 프로젝트 엔티티 생성
        Project project = Project.builder()
                .orgId(organization.getOrgId())
                .categoryId(categoryId)
                .title(request.getTitle())
                .description(request.getDescription())
                .targetAmount(request.getTargetAmount())
                .currentAmount(BigDecimal.ZERO)
                .donorCount(0)
                .startDate(LocalDate.parse(request.getStartDate()))
                .endDate(LocalDate.parse(request.getEndDate()))
                .status(Project.ProjectStatus.ACTIVE) // 즉시 활성화
                .build();

        // 4. 프로젝트 저장
        Project savedProject = projectRepository.save(project);

        // 5. 이미지 저장
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (int i = 0; i < images.size(); i++) {
                MultipartFile imageFile = images.get(i);
                String imagePath = fileStorageService.saveProjectImage(imageFile);

                ProjectImage projectImage = ProjectImage.builder()
                        .projectId(savedProject.getProjectId())
                        .filePath(imagePath)
                        .fileName(imageFile.getOriginalFilename())
                        .fileSize(imageFile.getSize())
                        .displayOrder(i)
                        .isThumbnail(i == 0)
                        .build();

                projectImageRepository.save(projectImage);
                imageUrls.add(imagePath);
            }
        }

        // 6. 사용계획서 저장
        if (planDocument != null && !planDocument.isEmpty()) {
            String documentPath = fileStorageService.saveProjectDocument(planDocument);

            ProjectDocument projectDocument = ProjectDocument.builder()
                    .projectId(savedProject.getProjectId())
                    .fileName(planDocument.getOriginalFilename())
                    .filePath(documentPath)
                    .fileSize(planDocument.getSize())
                    .documentType(ProjectDocument.DocumentType.USAGE_PLAN)
                    .build();

            projectDocumentRepository.save(projectDocument);
        }

        // 7. DTO 변환 및 반환
        String categoryName = getCategoryName(categoryId);
        return ProjectResponse.from(savedProject, categoryName, imageUrls);
    }

    /**
     * 프로젝트 간단 조회 (목록용)
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다"));

        // 이미지 URL 조회
        List<String> imageUrls = projectImageRepository.findByProjectIdOrderByDisplayOrder(projectId)
                .stream()
                .map(ProjectImage::getFilePath)
                .collect(Collectors.toList());

        String categoryName = getCategoryName(project.getCategoryId());
        return ProjectResponse.from(project, categoryName, imageUrls);
    }

    /**
     * 프로젝트 상세 조회 (상세 페이지용)
     */
    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectDetail(Long projectId) {
        // 1. 프로젝트 조회
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다"));

        // 2. 기관 정보 조회
        Organization organization = organizationRepository.findById(project.getOrgId())
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다"));

        // 3. 이미지 목록 조회
        List<ProjectImage> projectImages = projectImageRepository.findByProjectIdOrderByDisplayOrder(projectId);

        // 4. 문서 목록 조회
        List<ProjectDocument> projectDocuments = projectDocumentRepository.findByProjectId(projectId);

        // 5. 카테고리명 조회
        String categoryName = getCategoryName(project.getCategoryId());

        // 6. DTO 변환 및 반환
        return ProjectDetailResponse.from(project, categoryName, organization, projectImages, projectDocuments);
    }

    /**
     * 전체 프로젝트 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return searchProjects(null, null, "latest");
    }

    /**
     * 프로젝트 검색 (카테고리, 키워드, 정렬)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> searchProjects(String category, String keyword, String sortBy) {
        List<Project> projects;

        // 카테고리 ID 변환
        Integer categoryId = null;
        if (category != null && !category.trim().isEmpty()) {
            categoryId = getCategoryId(category);
        }

        // 검색 조건에 따라 Repository 메서드 호출
        if (categoryId != null && keyword != null && !keyword.trim().isEmpty()) {
            // 카테고리 + 키워드
            projects = projectRepository.findByStatusAndCategoryIdAndTitleContainingIgnoreCase(
                    Project.ProjectStatus.ACTIVE, categoryId, keyword);
        } else if (categoryId != null) {
            // 카테고리만
            projects = projectRepository.findByStatusAndCategoryId(
                    Project.ProjectStatus.ACTIVE, categoryId);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            // 키워드만
            projects = projectRepository.findByStatusAndTitleContainingIgnoreCase(
                    Project.ProjectStatus.ACTIVE, keyword);
        } else {
            // 전체 (ACTIVE 상태만)
            projects = projectRepository.findByStatus(Project.ProjectStatus.ACTIVE);
        }

        // 정렬
        if ("deadline".equals(sortBy)) {
            // 마감임박순 (endDate 오름차순)
            projects = projects.stream()
                    .sorted((p1, p2) -> p1.getEndDate().compareTo(p2.getEndDate()))
                    .collect(Collectors.toList());
        } else if ("fundingRate".equals(sortBy)) {
            // 모금률순 (currentAmount / targetAmount 내림차순)
            projects = projects.stream()
                    .sorted((p1, p2) -> {
                        double rate1 = p1.getCurrentAmount().divide(p1.getTargetAmount(), 4, BigDecimal.ROUND_HALF_UP).doubleValue();
                        double rate2 = p2.getCurrentAmount().divide(p2.getTargetAmount(), 4, BigDecimal.ROUND_HALF_UP).doubleValue();
                        return Double.compare(rate2, rate1);
                    })
                    .collect(Collectors.toList());
        } else {
            // 최신순 (기본)
            projects = projects.stream()
                    .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                    .collect(Collectors.toList());
        }

        // DTO 변환
        return projects.stream()
                .map(project -> {
                    List<String> imageUrls = projectImageRepository.findByProjectIdOrderByDisplayOrder(project.getProjectId())
                            .stream()
                            .map(ProjectImage::getFilePath)
                            .collect(Collectors.toList());

                    String categoryName = getCategoryName(project.getCategoryId());
                    return ProjectResponse.from(project, categoryName, imageUrls);
                })
                .collect(Collectors.toList());
    }

    /**
     * 인기 프로젝트 조회 (관심 등록 수 기준 정렬)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getPopularProjects(int limit) {
        // 1. 관심 등록 수가 많은 프로젝트 ID 목록 조회
        List<Long> topProjectIds = favoriteProjectService.getTopProjectIdsByFavoriteCount(limit);

        // 2. 프로젝트 정보 조회 및 DTO 변환
        return topProjectIds.stream()
                .map(projectId -> {
                    Project project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다"));

                    // ACTIVE 상태인 프로젝트만 반환
                    if (project.getStatus() != Project.ProjectStatus.ACTIVE) {
                        return null;
                    }

                    List<String> imageUrls = projectImageRepository.findByProjectIdOrderByDisplayOrder(project.getProjectId())
                            .stream()
                            .map(ProjectImage::getFilePath)
                            .collect(Collectors.toList());

                    String categoryName = getCategoryName(project.getCategoryId());
                    return ProjectResponse.from(project, categoryName, imageUrls);
                })
                .filter(response -> response != null) // null 제거
                .limit(limit) // ACTIVE가 아닌 프로젝트를 제외한 후 다시 limit 적용
                .collect(Collectors.toList());
    }
}
