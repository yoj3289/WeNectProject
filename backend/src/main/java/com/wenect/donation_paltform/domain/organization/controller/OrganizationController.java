package com.wenect.donation_paltform.domain.organization.controller;

import com.wenect.donation_paltform.domain.organization.dto.OrganizationStatsResponse;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.organization.service.OrganizationService;
import com.wenect.donation_paltform.domain.project.dto.ProjectResponse;
import com.wenect.donation_paltform.domain.project.service.ProjectService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.common.PageResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 기관 관리 컨트롤러
 * - 기관 대시보드, 프로젝트 관리 API 제공
 */
@RestController
@RequestMapping("/api/organization")
@RequiredArgsConstructor
@Slf4j
public class OrganizationController {

    private final OrganizationService organizationService;
    private final ProjectService projectService;
    private final JwtTokenProvider jwtTokenProvider;
    private final OrganizationRepository organizationRepository;

    /**
     * 기관 통계 조회
     * GET /api/organization/stats
     *
     * @param authHeader Authorization 헤더 (JWT 토큰)
     * @return 기관 통계 정보
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<OrganizationStatsResponse>> getOrganizationStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // JWT에서 userId 추출
            Long orgId = getOrgIdFromToken(authHeader);

            OrganizationStatsResponse stats = organizationService.getOrganizationStats(orgId);

            return ResponseEntity.ok(
                    ApiResponse.success(stats, "기관 통계 조회 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            log.error("기관 통계 조회 실패", e);
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("통계 조회 중 오류가 발생했습니다: " + e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    /**
     * 기관의 전체 프로젝트 목록 조회
     * GET /api/organization/projects
     *
     * @param authHeader Authorization 헤더 (JWT 토큰)
     * @param status 프로젝트 상태 필터 (선택, ACTIVE/COMPLETED/SETTLEMENT/CLOSED)
     * @param category 카테고리 필터 (선택)
     * @param search 검색 키워드 (선택)
     * @param sortBy 정렬 기준 (선택, latest/deadline/fundingRate, 기본값: latest)
     * @return 프로젝트 목록
     */
    @GetMapping("/projects")
    public ResponseEntity<PageResponse<ProjectResponse>> getOrganizationProjects(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "sortBy", defaultValue = "latest") String sortBy) {

        try {
            // JWT에서 orgId 추출
            Long orgId = getOrgIdFromToken(authHeader);

            // 기관의 프로젝트 조회 (ProjectService에 새 메서드 필요)
            List<ProjectResponse> responses = projectService.searchOrganizationProjects(
                    orgId, status, category, search, sortBy);

            PageResponse<ProjectResponse> pageResponse = PageResponse.of(responses);
            return ResponseEntity.ok(pageResponse);

        } catch (IllegalArgumentException e) {
            log.warn("프로젝트 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("프로젝트 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 재심사 요청
     * POST /api/organization/reapply
     *
     * @param userId 사용자 ID
     * @param userName 담당자명
     * @param phone 연락처
     * @param organizationName 기관명
     * @param businessNumber 사업자번호
     * @param representativeName 대표자명
     * @param password 비밀번호 (본인 확인용)
     * @param file 제출서류 파일
     * @return 재심사 요청 결과
     */
    @PostMapping("/reapply")
    public ResponseEntity<Map<String, String>> reapplyOrganization(
            @RequestParam Long userId,
            @RequestParam String userName,
            @RequestParam String phone,
            @RequestParam String organizationName,
            @RequestParam String businessNumber,
            @RequestParam String representativeName,
            @RequestParam String password,
            @RequestParam(required = false) MultipartFile file
    ) {
        try {
            organizationService.reapplyOrganization(
                    userId, userName, phone, organizationName,
                    businessNumber, representativeName, password, file
            );

            return ResponseEntity.ok(Map.of(
                    "message", "재심사 요청이 완료되었습니다.",
                    "status", "success"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", e.getMessage(),
                    "status", "error"
            ));
        } catch (Exception e) {
            log.error("재심사 요청 중 오류 발생", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "재심사 요청 중 오류가 발생했습니다.",
                    "status", "error"
            ));
        }
    }

    /**
     * JWT 토큰에서 기관 ID(orgId) 추출
     * User ID → Organization ID 매핑
     *
     * @param authHeader Authorization 헤더
     * @return 기관 ID
     */
    private Long getOrgIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }

        String token = authHeader.substring(7); // "Bearer " 제거
        Long userId = jwtTokenProvider.getUserId(token);

        // User ID로 Organization 조회
        Organization organization = organizationRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다. userId: " + userId));

        return organization.getOrgId();
    }
}
