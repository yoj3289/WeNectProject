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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectImageRepository projectImageRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final OrganizationRepository organizationRepository;
    private final com.wenect.donation_paltform.global.service.RemoteFileStorageService fileStorageService;
    private final com.wenect.donation_paltform.domain.favorite.service.FavoriteProjectService favoriteProjectService;
    private final DonationOptionService donationOptionService;
    private final com.wenect.donation_paltform.domain.settlement.repository.SettlementRepository settlementRepository;

    @PersistenceContext
    private EntityManager entityManager;

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
                .budgetPlan(request.getBudgetPlan())
                .isPlanPublic(request.getIsPlanPublic() != null ? request.getIsPlanPublic() : true)
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

            // Project 엔티티에 planDocumentUrl 설정
            savedProject.setPlanDocumentUrl(documentPath);
            projectRepository.save(savedProject);

            ProjectDocument projectDocument = ProjectDocument.builder()
                    .projectId(savedProject.getProjectId())
                    .fileName(planDocument.getOriginalFilename())
                    .filePath(documentPath)
                    .fileSize(planDocument.getSize())
                    .documentType(ProjectDocument.DocumentType.USAGE_PLAN)
                    .build();

            projectDocumentRepository.save(projectDocument);
        }

        // 7. 기부 옵션 저장
        if (request.getDonationOptions() != null && !request.getDonationOptions().isEmpty()) {
            donationOptionService.createOptions(savedProject.getProjectId(), request.getDonationOptions());
        }

        // 8. DTO 변환 및 반환
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

    /**
     * 프로젝트 삭제
     *
     * 삭제 로직:
     * 1. 권한 확인 (프로젝트 작성자만 삭제 가능)
     * 2. 삭제 가능 여부 확인
     *    - piggy_banks 테이블에 데이터가 있으면 삭제 불가 (ON DELETE RESTRICT)
     *    - settlements 테이블에 데이터가 있으면 삭제 불가 (ON DELETE RESTRICT)
     * 3. 물리적 파일 삭제 (images, documents)
     * 4. 프로젝트 삭제 (DB)
     *    - project_images: CASCADE로 자동 삭제
     *    - project_documents: CASCADE로 자동 삭제
     *    - favorite_projects: CASCADE로 자동 삭제
     *    - donations: project_id가 NULL로 변경됨 (SET NULL)
     *
     * @param projectId 삭제할 프로젝트 ID
     * @param userId 요청한 사용자 ID
     * @throws IllegalArgumentException 프로젝트를 찾을 수 없는 경우
     * @throws IllegalStateException 권한이 없거나 삭제할 수 없는 경우
     */
    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        // 1. 프로젝트 조회
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다"));

        // 2. 기관 정보 조회
        Organization organization = organizationRepository.findById(project.getOrgId())
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다"));

        // 3. 권한 확인 (프로젝트 작성자만 삭제 가능)
        if (!organization.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("프로젝트를 삭제할 권한이 없습니다");
        }

        // 4. 삭제 가능 여부 확인
        // 4-1. 저금통에 잔액이 있는지 확인 (Native SQL)
        Long piggyBankCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM piggy_banks WHERE project_id = :projectId AND balance > 0")
                .setParameter("projectId", projectId)
                .getSingleResult()).longValue();

        if (piggyBankCount > 0) {
            throw new IllegalStateException("저금통에 잔액이 있는 프로젝트는 삭제할 수 없습니다. 먼저 저금통을 정산하거나 출금해주세요.");
        }

        // 4-2. 정산 내역 확인 (Native SQL)
        Long settlementCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM settlements WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .getSingleResult()).longValue();

        if (settlementCount > 0) {
            throw new IllegalStateException("정산 내역이 있는 프로젝트는 삭제할 수 없습니다.");
        }

        // 4-3. 저금통 데이터 중 잔액이 0인 것들은 삭제 (DB 제약조건 우회)
        entityManager.createNativeQuery(
                "DELETE FROM piggy_banks WHERE project_id = :projectId AND balance = 0")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 5. 물리적 파일 삭제
        // 5-1. 이미지 파일 삭제
        List<ProjectImage> images = projectImageRepository.findByProjectIdOrderByDisplayOrder(projectId);
        for (ProjectImage image : images) {
            fileStorageService.deleteFile(image.getFilePath());
        }

        // 5-2. 문서 파일 삭제
        List<ProjectDocument> documents = projectDocumentRepository.findByProjectId(projectId);
        for (ProjectDocument document : documents) {
            fileStorageService.deleteFile(document.getFilePath());
        }

        // 6. 프로젝트 삭제 (DB)
        // CASCADE 설정으로 project_images, project_documents, favorite_projects는 자동 삭제
        // donations의 project_id는 NULL로 변경됨
        projectRepository.delete(project);
    }

    /**
     * 기관의 프로젝트 목록 조회 (기관 대시보드용)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> searchOrganizationProjects(
            Long orgId,
            String statusFilter,
            String category,
            String keyword,
            String sortBy) {

        // 1. 기관의 모든 프로젝트 조회
        List<Project> projects = projectRepository.findByOrgId(orgId);

        // 2. 상태 필터링
        if (statusFilter != null && !statusFilter.isEmpty()) {
            try {
                Project.ProjectStatus status = Project.ProjectStatus.valueOf(statusFilter.toUpperCase());
                projects = projects.stream()
                        .filter(p -> p.getStatus() == status)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                // 잘못된 상태값은 무시
            }
        }

        // 3. 카테고리 필터링
        if (category != null && !category.isEmpty()) {
            Integer categoryId = getCategoryId(category);
            projects = projects.stream()
                    .filter(p -> p.getCategoryId().equals(categoryId))
                    .collect(Collectors.toList());
        }

        // 4. 검색 필터링
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            projects = projects.stream()
                    .filter(p -> p.getTitle().toLowerCase().contains(lowerKeyword))
                    .collect(Collectors.toList());
        }

        // 5. 정렬 및 변환
        return convertToResponseList(projects, sortBy);
    }

    /**
     * 정산 프로젝트 검색 (COMPLETED, SETTLEMENT, CLOSED 상태만)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> searchSettlementProjects(String category, String keyword, String sortBy) {
        List<Project> projects = new ArrayList<>();

        // 결산 관련 상태 조회
        List<Project> completedProjects = projectRepository.findByStatus(Project.ProjectStatus.COMPLETED);
        List<Project> settlementProjects = projectRepository.findByStatus(Project.ProjectStatus.SETTLEMENT);
        List<Project> closedProjects = projectRepository.findByStatus(Project.ProjectStatus.CLOSED);

        projects.addAll(completedProjects);
        projects.addAll(settlementProjects);
        projects.addAll(closedProjects);

        // 카테고리 필터링
        if (category != null && !category.isEmpty()) {
            Integer categoryId = getCategoryId(category);
            projects = projects.stream()
                    .filter(p -> p.getCategoryId().equals(categoryId))
                    .collect(Collectors.toList());
        }

        // 검색 필터링
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            projects = projects.stream()
                    .filter(p -> p.getTitle().toLowerCase().contains(lowerKeyword))
                    .collect(Collectors.toList());
        }

        return convertToResponseList(projects, sortBy);
    }

    /**
     * 프로젝트 결산 완료
     */
    @Transactional
    public void closeSettlement(Long projectId) {
        // 1. 프로젝트 조회
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 2. 프로젝트 상태 확인 (SETTLEMENT 상태여야 함)
        if (project.getStatus() != Project.ProjectStatus.SETTLEMENT) {
            throw new IllegalStateException("결산 중인 프로젝트만 결산 완료가 가능합니다.");
        }

        // 3. 저금통 잔액 확인 (Native SQL)
        Long balanceCount = ((Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM piggy_banks WHERE project_id = :projectId AND balance > 0")
                .setParameter("projectId", projectId)
                .getSingleResult()).longValue();

        if (balanceCount > 0) {
            throw new IllegalStateException("저금통 잔액이 남아있어 결산을 완료할 수 없습니다.");
        }

        // 4. 프로젝트 상태를 CLOSED로 변경
        project.setStatus(Project.ProjectStatus.CLOSED);
        projectRepository.save(project);

        // 5. 저금통 상태를 WITHDRAWN으로 변경 (Native SQL)
        entityManager.createNativeQuery(
                        "UPDATE piggy_banks SET status = 'WITHDRAWN' WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        log.info("프로젝트 결산 완료 - projectId: {}", projectId);
    }

    /**
     * 프로젝트 목록을 정렬하고 ProjectResponse로 변환
     */
    private List<ProjectResponse> convertToResponseList(List<Project> projects, String sortBy) {
        // 1. 정렬
        if (sortBy != null) {
            switch (sortBy) {
                case "deadline":
                    projects.sort((p1, p2) -> p1.getEndDate().compareTo(p2.getEndDate()));
                    break;
                case "fundingRate":
                    projects.sort((p1, p2) -> {
                        BigDecimal rate1 = p1.getCurrentAmount()
                                .multiply(BigDecimal.valueOf(100))
                                .divide(p1.getTargetAmount(), 2, BigDecimal.ROUND_HALF_UP);
                        BigDecimal rate2 = p2.getCurrentAmount()
                                .multiply(BigDecimal.valueOf(100))
                                .divide(p2.getTargetAmount(), 2, BigDecimal.ROUND_HALF_UP);
                        return rate2.compareTo(rate1);
                    });
                    break;
                case "latest":
                default:
                    projects.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));
                    break;
            }
        }

        // 2. DTO 변환
        return projects.stream()
                .map(project -> {
                    List<String> imageUrls = projectImageRepository.findByProjectIdOrderByDisplayOrder(project.getProjectId())
                            .stream()
                            .map(ProjectImage::getFilePath)
                            .collect(Collectors.toList());

                    String categoryName = getCategoryName(project.getCategoryId());
                    ProjectResponse response = ProjectResponse.from(project, categoryName, imageUrls);

                    // COMPLETED 상태인 경우 Settlement 정보 추가
                    if (project.getStatus() == Project.ProjectStatus.COMPLETED) {
                        settlementRepository.findFirstByProjectIdOrderByRequestedAtDesc(project.getProjectId())
                                .ifPresent(settlement -> {
                                    response.setSettlementId(settlement.getSettlementId());
                                    response.setSettlementStatus(settlement.getStatus().name());
                                });
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }
}
