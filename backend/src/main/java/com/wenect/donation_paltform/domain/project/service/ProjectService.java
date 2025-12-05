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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
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

        // 2. 프로젝트 기간 유효성 검증
        validateProjectDates(request.getStartDate(), request.getEndDate());

        // 3. 카테고리명 -> ID 변환
        Integer categoryId = getCategoryId(request.getCategory());

        // 4. 프로젝트 엔티티 생성
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
        } else if ("mostDonated".equals(sortBy)) {
            // 가장 많이 후원받은 프로젝트 순 (currentAmount 내림차순, 동점이면 최신순)
            projects = projects.stream()
                    .sorted((p1, p2) -> {
                        int amountCompare = p2.getCurrentAmount().compareTo(p1.getCurrentAmount());
                        if (amountCompare != 0) return amountCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                    })
                    .collect(Collectors.toList());
        } else if ("leastDonated".equals(sortBy)) {
            // 가장 적게 후원받은 프로젝트 순 (currentAmount 오름차순, 동점이면 최신순)
            projects = projects.stream()
                    .sorted((p1, p2) -> {
                        int amountCompare = p1.getCurrentAmount().compareTo(p2.getCurrentAmount());
                        if (amountCompare != 0) return amountCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                    })
                    .collect(Collectors.toList());
        } else if ("mostFavorited".equals(sortBy)) {
            // 가장 관심을 많이 받은 프로젝트 순 (favoriteCount 내림차순, 동점이면 최신순)
            projects = projects.stream()
                    .sorted((p1, p2) -> {
                        Long count1 = favoriteProjectService.getFavoriteCount(p1.getProjectId());
                        Long count2 = favoriteProjectService.getFavoriteCount(p2.getProjectId());
                        int countCompare = count2.compareTo(count1);
                        if (countCompare != 0) return countCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                    })
                    .collect(Collectors.toList());
        } else if ("leastFavorited".equals(sortBy)) {
            // 가장 관심을 적게 받은 프로젝트 순 (favoriteCount 오름차순, 동점이면 최신순)
            projects = projects.stream()
                    .sorted((p1, p2) -> {
                        Long count1 = favoriteProjectService.getFavoriteCount(p1.getProjectId());
                        Long count2 = favoriteProjectService.getFavoriteCount(p2.getProjectId());
                        int countCompare = count1.compareTo(count2);
                        if (countCompare != 0) return countCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
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
     * 프로젝트 검색 (페이지네이션 버전)
     * @param category 카테고리명 (선택)
     * @param keyword 검색 키워드 (선택)
     * @param sortBy 정렬 기준 (latest, deadline, mostDonated, leastDonated, mostFavorited, leastFavorited)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     */
    @Transactional(readOnly = true)
    public Page<ProjectResponse> searchProjectsPaged(String category, String keyword, String sortBy, int page, int size) {
        // 카테고리 ID 변환
        Integer categoryId = null;
        if (category != null && !category.trim().isEmpty()) {
            categoryId = getCategoryId(category);
        }

        // 정렬 기준 설정
        Sort sort = getSortBySortBy(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Project> projectPage;

        // 검색 조건에 따라 Repository 메서드 호출
        if (categoryId != null && keyword != null && !keyword.trim().isEmpty()) {
            projectPage = projectRepository.findByStatusAndCategoryIdAndTitleContainingIgnoreCase(
                    Project.ProjectStatus.ACTIVE, categoryId, keyword, pageable);
        } else if (categoryId != null) {
            projectPage = projectRepository.findByStatusAndCategoryId(
                    Project.ProjectStatus.ACTIVE, categoryId, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            projectPage = projectRepository.findByStatusAndTitleContainingIgnoreCase(
                    Project.ProjectStatus.ACTIVE, keyword, pageable);
        } else {
            projectPage = projectRepository.findByStatus(Project.ProjectStatus.ACTIVE, pageable);
        }

        // mostFavorited, leastFavorited는 별도 처리 필요 (DB에서 직접 정렬 불가)
        if ("mostFavorited".equals(sortBy) || "leastFavorited".equals(sortBy)) {
            return handleFavoriteSorting(projectPage, sortBy, page, size);
        }

        // DTO 변환
        return projectPage.map(this::convertToProjectResponse);
    }

    /**
     * 정산 프로젝트 검색 (페이지네이션 버전)
     */
    @Transactional(readOnly = true)
    public Page<ProjectResponse> searchSettlementProjectsPaged(String category, String keyword, String sortBy, int page, int size) {
        Integer categoryId = null;
        if (category != null && !category.trim().isEmpty()) {
            categoryId = getCategoryId(category);
        }

        Sort sort = getSortBySortBy(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Project> projectPage;

        if (categoryId != null && keyword != null && !keyword.trim().isEmpty()) {
            projectPage = projectRepository.findSettlementProjectsByCategoryIdAndTitleContaining(categoryId, keyword, pageable);
        } else if (categoryId != null) {
            projectPage = projectRepository.findSettlementProjectsByCategoryId(categoryId, pageable);
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            projectPage = projectRepository.findSettlementProjectsByTitleContaining(keyword, pageable);
        } else {
            projectPage = projectRepository.findSettlementProjects(pageable);
        }

        return projectPage.map(this::convertToProjectResponseWithSettlement);
    }

    /**
     * 정렬 기준 문자열을 Sort 객체로 변환
     */
    private Sort getSortBySortBy(String sortBy) {
        if (sortBy == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        switch (sortBy) {
            case "deadline":
                return Sort.by(Sort.Direction.ASC, "endDate");
            case "mostDonated":
                return Sort.by(Sort.Direction.DESC, "currentAmount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "leastDonated":
                return Sort.by(Sort.Direction.ASC, "currentAmount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "latest":
            default:
                return Sort.by(Sort.Direction.DESC, "createdAt");
        }
    }

    /**
     * 관심 수 정렬 처리 (DB에서 직접 정렬 불가하여 메모리에서 처리)
     */
    private Page<ProjectResponse> handleFavoriteSorting(Page<Project> projectPage, String sortBy, int page, int size) {
        List<Project> allProjects = projectPage.getContent();

        Comparator<Project> comparator = (p1, p2) -> {
            Long count1 = favoriteProjectService.getFavoriteCount(p1.getProjectId());
            Long count2 = favoriteProjectService.getFavoriteCount(p2.getProjectId());
            int countCompare = "mostFavorited".equals(sortBy) ? count2.compareTo(count1) : count1.compareTo(count2);
            if (countCompare != 0) return countCompare;
            return p2.getCreatedAt().compareTo(p1.getCreatedAt());
        };

        List<ProjectResponse> sortedList = allProjects.stream()
                .sorted(comparator)
                .map(this::convertToProjectResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(sortedList, PageRequest.of(page, size), projectPage.getTotalElements());
    }

    /**
     * Project 엔티티를 ProjectResponse로 변환
     */
    private ProjectResponse convertToProjectResponse(Project project) {
        List<String> imageUrls = projectImageRepository.findByProjectIdOrderByDisplayOrder(project.getProjectId())
                .stream()
                .map(ProjectImage::getFilePath)
                .collect(Collectors.toList());

        String categoryName = getCategoryName(project.getCategoryId());
        return ProjectResponse.from(project, categoryName, imageUrls);
    }

    /**
     * Project 엔티티를 ProjectResponse로 변환 (Settlement 정보 포함)
     */
    private ProjectResponse convertToProjectResponseWithSettlement(Project project) {
        ProjectResponse response = convertToProjectResponse(project);

        // COMPLETED 상태인 경우 Settlement 정보 추가
        if (project.getStatus() == Project.ProjectStatus.COMPLETED) {
            settlementRepository.findFirstByProjectIdOrderByRequestedAtDesc(project.getProjectId())
                    .ifPresent(settlement -> {
                        response.setSettlementId(settlement.getSettlementId());
                        response.setSettlementStatus(settlement.getStatus().name());
                    });
        }

        return response;
    }

    /**
     * 인기 프로젝트 조회 (관심 등록 수 기준 정렬)
     * - ACTIVE 상태의 프로젝트만 대상
     * - 관심 등록 수가 많은 순으로 정렬
     * - 관심 등록 수가 같으면 최신순 (created_at 내림차순)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getPopularProjects(int limit) {
        // 1. ACTIVE 상태의 프로젝트 조회
        List<Project> projects = projectRepository.findByStatus(Project.ProjectStatus.ACTIVE);

        // 2. 관심 등록 수로 정렬 및 limit 적용
        List<Project> sortedProjects = projects.stream()
                .sorted((p1, p2) -> {
                    Long count1 = favoriteProjectService.getFavoriteCount(p1.getProjectId());
                    Long count2 = favoriteProjectService.getFavoriteCount(p2.getProjectId());
                    int countCompare = count2.compareTo(count1); // 내림차순
                    if (countCompare != 0) return countCompare;
                    return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                })
                .limit(limit)
                .collect(Collectors.toList());

        // 3. DTO 변환
        return sortedProjects.stream()
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
     * 모금액 순 프로젝트 조회 (current_amount 기준 정렬)
     * - 모금액이 0원인 프로젝트는 제외
     * - 모금액이 같으면 생성일(created_at) 기준 오름차순 (먼저 생성된 것부터)
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getTopFundedProjects(int limit) {
        // ACTIVE 상태이면서 모금액이 0원보다 큰 프로젝트를 모금액 내림차순, 생성일 오름차순으로 조회
        List<Project> projects = projectRepository.findTopByCurrentAmountDesc();

        return projects.stream()
                .limit(limit) // Stream에서 limit 적용
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
                case "mostDonated":
                    // 가장 많이 후원받은 프로젝트 순 (currentAmount 내림차순, 동점이면 최신순)
                    projects.sort((p1, p2) -> {
                        int amountCompare = p2.getCurrentAmount().compareTo(p1.getCurrentAmount());
                        if (amountCompare != 0) return amountCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                    });
                    break;
                case "leastDonated":
                    // 가장 적게 후원받은 프로젝트 순 (currentAmount 오름차순, 동점이면 최신순)
                    projects.sort((p1, p2) -> {
                        int amountCompare = p1.getCurrentAmount().compareTo(p2.getCurrentAmount());
                        if (amountCompare != 0) return amountCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                    });
                    break;
                case "mostFavorited":
                    // 가장 관심을 많이 받은 프로젝트 순 (favoriteCount 내림차순, 동점이면 최신순)
                    projects.sort((p1, p2) -> {
                        Long count1 = favoriteProjectService.getFavoriteCount(p1.getProjectId());
                        Long count2 = favoriteProjectService.getFavoriteCount(p2.getProjectId());
                        int countCompare = count2.compareTo(count1);
                        if (countCompare != 0) return countCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
                    });
                    break;
                case "leastFavorited":
                    // 가장 관심을 적게 받은 프로젝트 순 (favoriteCount 오름차순, 동점이면 최신순)
                    projects.sort((p1, p2) -> {
                        Long count1 = favoriteProjectService.getFavoriteCount(p1.getProjectId());
                        Long count2 = favoriteProjectService.getFavoriteCount(p2.getProjectId());
                        int countCompare = count1.compareTo(count2);
                        if (countCompare != 0) return countCompare;
                        return p2.getCreatedAt().compareTo(p1.getCreatedAt()); // 동점이면 최신순
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

    /**
     * 프로젝트 수정 (제목, 소개만 수정 가능)
     * - CLOSED, CANCELLED, REJECTED 상태는 수정 불가
     */
    @Transactional
    public ProjectResponse updateProject(Long userId, Long projectId, com.wenect.donation_paltform.domain.project.dto.UpdateProjectRequest request) {
        log.info("프로젝트 수정 요청 - projectId: {}, userId: {}", projectId, userId);

        // 1. 프로젝트 조회
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다"));

        // 2. 소유자 확인
        Organization organization = organizationRepository.findById(project.getOrgId())
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다"));

        if (!organization.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("프로젝트를 수정할 권한이 없습니다");
        }

        // 3. 상태 확인 (CLOSED, CANCELLED, REJECTED는 수정 불가)
        if (project.getStatus() == Project.ProjectStatus.CLOSED ||
            project.getStatus() == Project.ProjectStatus.CANCELLED ||
            project.getStatus() == Project.ProjectStatus.REJECTED) {
            throw new IllegalStateException("종료되거나 취소/반려된 프로젝트는 수정할 수 없습니다");
        }

        // 4. 제목과 소개만 수정
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            project.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            project.setDescription(request.getDescription());
        }

        // 5. 저장
        Project updatedProject = projectRepository.save(project);

        // 6. 이미지 조회 및 DTO 변환
        List<String> imageUrls = projectImageRepository.findByProjectIdOrderByDisplayOrder(projectId)
                .stream()
                .map(ProjectImage::getFilePath)
                .collect(Collectors.toList());

        String categoryName = getCategoryName(updatedProject.getCategoryId());

        log.info("프로젝트 수정 완료 - projectId: {}", projectId);
        return ProjectResponse.from(updatedProject, categoryName, imageUrls);
    }

    /**
     * 프로젝트 기간 유효성 검증
     * - 시작일은 오늘 이후여야 함
     * - 종료일은 시작일 이후여야 함
     * - 최소 모금 기간은 7일
     */
    private void validateProjectDates(String startDateStr, String endDateStr) {
        LocalDate startDate = LocalDate.parse(startDateStr);
        LocalDate endDate = LocalDate.parse(endDateStr);
        LocalDate today = LocalDate.now();

        // 시작일은 오늘 이후여야 함
        if (startDate.isBefore(today)) {
            throw new IllegalArgumentException("시작일은 오늘(" + today + ") 이후여야 합니다.");
        }

        // 종료일은 시작일 이후여야 함
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다.");
        }

        // 최소 모금 기간은 7일
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween < 7) {
            throw new IllegalArgumentException("모금 기간은 최소 7일 이상이어야 합니다. (현재: " + daysBetween + "일)");
        }
    }

    /**
     * 특정 기관의 프로젝트 검색 (페이지네이션)
     * - ACTIVE 상태인 프로젝트만 조회
     * - 카테고리, 검색어, 정렬 기준 지원
     *
     * @param orgId 기관 ID
     * @param category 카테고리명 (선택)
     * @param keyword 검색 키워드 (선택)
     * @param sortBy 정렬 기준 (latest, deadline, mostDonated)
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @return 프로젝트 페이지
     */
    @Transactional(readOnly = true)
    public Page<ProjectResponse> searchProjectsByOrganization(Long orgId, String category, String keyword, String sortBy, int page, int size) {
        // 1. 카테고리 ID 변환
        Integer categoryId = null;
        if (category != null && !category.trim().isEmpty()) {
            categoryId = getCategoryId(category);
        }

        // 2. 해당 기관의 모든 ACTIVE 프로젝트 조회
        List<Project> projects = projectRepository.findByOrgId(orgId).stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .collect(Collectors.toList());

        // 3. 카테고리 필터 적용
        if (categoryId != null) {
            Integer finalCategoryId = categoryId;
            projects = projects.stream()
                    .filter(p -> p.getCategoryId().equals(finalCategoryId))
                    .collect(Collectors.toList());
        }

        // 4. 검색어 필터 적용
        if (keyword != null && !keyword.trim().isEmpty()) {
            String searchLower = keyword.toLowerCase();
            projects = projects.stream()
                    .filter(p -> p.getTitle().toLowerCase().contains(searchLower))
                    .collect(Collectors.toList());
        }

        // 5. 정렬 적용
        Comparator<Project> comparator;
        switch (sortBy) {
            case "deadline":
                comparator = Comparator.comparing(Project::getEndDate);
                break;
            case "mostDonated":
                comparator = Comparator.comparing(Project::getCurrentAmount).reversed()
                        .thenComparing(Comparator.comparing(Project::getCreatedAt).reversed());
                break;
            case "latest":
            default:
                comparator = Comparator.comparing(Project::getCreatedAt).reversed();
                break;
        }
        projects.sort(comparator);

        // 6. DTO 변환
        List<ProjectResponse> responses = projects.stream()
                .map(this::convertToProjectResponse)
                .collect(Collectors.toList());

        // 7. 페이지네이션 적용
        int start = page * size;
        int end = Math.min(start + size, responses.size());
        List<ProjectResponse> pagedResponses = responses.subList(start, end);

        // 8. Page 객체 생성
        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(pagedResponses, pageable, responses.size());
    }
}
