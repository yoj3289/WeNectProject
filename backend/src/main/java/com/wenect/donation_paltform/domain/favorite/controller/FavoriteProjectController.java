package com.wenect.donation_paltform.domain.favorite.controller;

import com.wenect.donation_paltform.domain.favorite.dto.FavoriteToggleResponse;
import com.wenect.donation_paltform.domain.favorite.service.FavoriteProjectService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 관심 프로젝트 컨트롤러
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteProjectController {

    private final FavoriteProjectService favoriteProjectService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 관심 프로젝트 토글 (추가/삭제)
     */
    @PostMapping("/projects/{projectId}")
    public ResponseEntity<ApiResponse<FavoriteToggleResponse>> toggleFavorite(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable(value = "projectId") Long projectId) {

        try {
            // JWT에서 userId 추출
            Long userId = getUserIdFromToken(authHeader);

            // 관심 프로젝트 토글
            boolean isFavorite = favoriteProjectService.toggleFavorite(userId, projectId);

            FavoriteToggleResponse response = FavoriteToggleResponse.builder()
                    .isFavorite(isFavorite)
                    .message(isFavorite ? "관심 프로젝트로 등록되었습니다" : "관심 프로젝트에서 제거되었습니다")
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("관심 프로젝트 처리 중 오류가 발생했습니다", "INTERNAL_ERROR"));
        }
    }

    /**
     * 사용자의 관심 프로젝트 목록 조회
     */
    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<Long>>> getUserFavoriteProjects(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // JWT에서 userId 추출
            Long userId = getUserIdFromToken(authHeader);

            // 관심 프로젝트 ID 목록 조회
            List<Long> projectIds = favoriteProjectService.getUserFavoriteProjectIds(userId);

            return ResponseEntity.ok(ApiResponse.success(projectIds, "관심 프로젝트 목록 조회 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("관심 프로젝트 조회 중 오류가 발생했습니다", "INTERNAL_ERROR"));
        }
    }

    /**
     * 관심 프로젝트 여부 확인
     */
    @GetMapping("/projects/{projectId}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkFavorite(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable(value = "projectId") Long projectId) {

        try {
            // JWT에서 userId 추출
            Long userId = getUserIdFromToken(authHeader);

            // 관심 프로젝트 여부 확인
            boolean isFavorite = favoriteProjectService.isFavorite(userId, projectId);

            return ResponseEntity.ok(ApiResponse.success(isFavorite, "관심 프로젝트 여부 확인 완료"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("관심 프로젝트 확인 중 오류가 발생했습니다", "INTERNAL_ERROR"));
        }
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
