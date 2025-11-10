package com.wenect.donation_paltform.domain.project.controller;

import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.domain.project.dto.CreateProjectRequest;
import com.wenect.donation_paltform.global.common.PageResponse;
import com.wenect.donation_paltform.domain.project.dto.ProjectDetailResponse;
import com.wenect.donation_paltform.domain.project.dto.ProjectResponse;
import com.wenect.donation_paltform.domain.project.service.ProjectService;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 프로젝트 등록
     *
     * 프론트엔드에서 FormData로 전송:
     * - title, category, description, targetAmount, startDate, endDate (텍스트)
     * - images (MultipartFile 배열, 최대 5개)
     * - planDocument (MultipartFile, 선택)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("targetAmount") BigDecimal targetAmount,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "planDocument", required = false) MultipartFile planDocument) {

        try {
            // JWT에서 userId 추출
            Long userId = getUserIdFromToken(authHeader);

            // DTO 생성
            CreateProjectRequest request = CreateProjectRequest.builder()
                    .title(title)
                    .category(category)
                    .description(description)
                    .targetAmount(targetAmount)
                    .startDate(startDate)
                    .endDate(endDate)
                    .build();

            // 서비스 호출
            ProjectResponse response = projectService.createProject(userId, request, images, planDocument);

            return ResponseEntity.ok(
                    ApiResponse.success(response, "프로젝트가 성공적으로 등록되었습니다"));

        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("파일 업로드 중 오류가 발생했습니다", "FILE_UPLOAD_ERROR"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("프로젝트 등록 중 오류가 발생했습니다: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    /**
     * 프로젝트 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDetailResponse> getProject(@PathVariable Long id) {
        try {
            ProjectDetailResponse response = projectService.getProjectDetail(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 전체 프로젝트 목록 조회
     */
    @GetMapping
    public ResponseEntity<PageResponse<ProjectResponse>> getAllProjects() {
        List<ProjectResponse> responses = projectService.getAllProjects();
        PageResponse<ProjectResponse> pageResponse = PageResponse.of(responses);
        return ResponseEntity.ok(pageResponse);
    }

    /**
     * 인기 프로젝트 조회 (홈페이지용)
     */
    @GetMapping("/popular")
    public ResponseEntity<List<ProjectResponse>> getPopularProjects(
            @RequestParam(defaultValue = "4") int limit) {
        List<ProjectResponse> responses = projectService.getPopularProjects(limit);
        return ResponseEntity.ok(responses);
    }

    /**
     * 프로젝트 기부자 목록 조회
     */
    @GetMapping("/{id}/donors")
    public ResponseEntity<List<Object>> getProjectDonors(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean showAnonymous) {
        // TODO: 실제 기부자 목록 조회 구현
        // 현재는 빈 배열 반환
        return ResponseEntity.ok(List.of());
    }

    /**
     * JWT 토큰에서 userId 추출
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }

        String token = authHeader.substring(7); // "Bearer " 제거
        return jwtTokenProvider.getUserId(token);
    }
}
