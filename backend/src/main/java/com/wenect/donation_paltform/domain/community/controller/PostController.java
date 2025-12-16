package com.wenect.donation_paltform.domain.community.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wenect.donation_paltform.domain.community.dto.CreatePostRequest;
import com.wenect.donation_paltform.domain.community.dto.PostListResponse;
import com.wenect.donation_paltform.domain.community.dto.PostResponse;
import com.wenect.donation_paltform.domain.community.dto.UpdatePostRequest;
import com.wenect.donation_paltform.domain.community.service.PostService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 게시글 목록 조회
     * GET /api/posts?type=NOTICE&search=검색어&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PostListResponse>> getPosts(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        try {
            // 로그인한 사용자인 경우 userId 추출 (좋아요 상태 확인용)
            Long userId = getUserIdFromTokenOptional(authHeader);
            PostListResponse response = postService.getPosts(type, search, page, size, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "게시글 목록 조회 성공"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("게시글 목록 조회 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 게시글 상세 조회
     * GET /api/posts/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        try {
            // 로그인한 사용자인 경우 userId 추출 (좋아요 상태 확인용)
            Long userId = getUserIdFromTokenOptional(authHeader);
            PostResponse response = postService.getPost(id, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "게시글 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("게시글 조회 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 게시글 작성
     * POST /api/posts
     * Content-Type: multipart/form-data
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "projectId", required = false) Long projectId,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            // JWT에서 userId 추출
            Long userId = getUserIdFromToken(authHeader);

            CreatePostRequest request = CreatePostRequest.builder()
                    .type(type)
                    .title(title)
                    .content(content)
                    .projectId(projectId)
                    .build();

            PostResponse response = postService.createPost(userId, request, images);

            return ResponseEntity.ok(ApiResponse.success(response, "게시글 작성 성공"));

        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("게시글 작성 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 게시글 수정
     * PUT /api/posts/{id}
     * Content-Type: multipart/form-data
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "removeImageIds", required = false) String removeImageIdsJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            // JWT에서 userId 추출
            Long userId = getUserIdFromToken(authHeader);

            // removeImageIds JSON 파싱
            List<Long> removeImageIds = null;
            if (removeImageIdsJson != null && !removeImageIdsJson.isEmpty()) {
                removeImageIds = objectMapper.readValue(removeImageIdsJson,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
            }

            UpdatePostRequest request = UpdatePostRequest.builder()
                    .title(title)
                    .content(content)
                    .removeImageIds(removeImageIds)
                    .build();

            PostResponse response = postService.updatePost(userId, id, request, images);

            return ResponseEntity.ok(ApiResponse.success(response, "게시글 수정 성공"));

        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("게시글 수정 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 게시글 삭제
     * DELETE /api/posts/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        try {
            Long userId = getUserIdFromToken(authHeader);
            postService.deletePost(userId, id);
            return ResponseEntity.ok(ApiResponse.success(null, "게시글 삭제 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("게시글 삭제 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 게시글 좋아요
     * POST /api/posts/{id}/like
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<PostResponse>> toggleLike(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        try {
            Long userId = getUserIdFromToken(authHeader);
            PostResponse response = postService.toggleLike(userId, id);
            return ResponseEntity.ok(ApiResponse.success(response, "좋아요 처리 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("좋아요 처리 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * JWT 토큰에서 userId 추출 (필수)
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다.");
        }

        String token = authHeader.substring(7);
        return jwtTokenProvider.getUserId(token);
    }

    /**
     * JWT 토큰에서 userId 추출 (선택 - 토큰이 없으면 null 반환)
     */
    private Long getUserIdFromTokenOptional(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        try {
            String token = authHeader.substring(7);
            return jwtTokenProvider.getUserId(token);
        } catch (Exception e) {
            return null;
        }
    }
}
