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
                return "아동복지";
            case 2:
                return "노인복지";
            case 3:
                return "장애인복지";
            case 4:
                return "동물보호";
            case 5:
                return "환경보호";
            case 6:
                return "교육";
            default:
                return "기타";
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
        List<Project> projects = projectRepository.findAll().stream()
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt())) // 최신순 정렬
                .collect(Collectors.toList());

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
     * 인기 프로젝트 조회 (기부자 수 기준 정렬)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getPopularProjects(int limit) {
        List<Project> projects = projectRepository.findAll().stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .sorted((p1, p2) -> p2.getDonorCount().compareTo(p1.getDonorCount()))
                .limit(limit)
                .collect(Collectors.toList());

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
}
