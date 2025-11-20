package com.wenect.donation_paltform.domain.community.controller;

import com.wenect.donation_paltform.domain.community.dto.CommentResponse;
import com.wenect.donation_paltform.domain.community.dto.CreateCommentRequest;
import com.wenect.donation_paltform.domain.community.dto.UpdateCommentRequest;
import com.wenect.donation_paltform.domain.community.service.CommentService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 게시글의 댓글 목록 조회
     * GET /api/posts/{postId}/comments
     */
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable Long postId) {
        try {
            List<CommentResponse> response = commentService.getComments(postId);
            return ResponseEntity.ok(ApiResponse.success(response, "댓글 목록 조회 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "NOT_FOUND"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("댓글 목록 조회 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 댓글 작성
     * POST /api/posts/{postId}/comments
     */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long postId,
            @RequestBody CreateCommentRequest request) {

        try {
            Long userId = getUserIdFromToken(authHeader);
            CommentResponse response = commentService.createComment(userId, postId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "댓글 작성 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("댓글 작성 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 댓글 수정
     * PUT /api/comments/{commentId}
     */
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long commentId,
            @RequestBody UpdateCommentRequest request) {

        try {
            Long userId = getUserIdFromToken(authHeader);
            CommentResponse response = commentService.updateComment(userId, commentId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "댓글 수정 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("댓글 수정 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 댓글 삭제
     * DELETE /api/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long commentId) {

        try {
            Long userId = getUserIdFromToken(authHeader);
            commentService.deleteComment(userId, commentId);
            return ResponseEntity.ok(ApiResponse.success(null, "댓글 삭제 성공"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(e.getMessage(), "INVALID_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("댓글 삭제 중 오류가 발생했습니다: " + e.getMessage(), "SERVER_ERROR"));
        }
    }

    /**
     * 댓글 좋아요
     * POST /api/comments/{commentId}/like
     */
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<CommentResponse>> toggleLike(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long commentId) {

        try {
            Long userId = getUserIdFromToken(authHeader);
            CommentResponse response = commentService.toggleLike(userId, commentId);
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
     * JWT 토큰에서 userId 추출
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다.");
        }

        String token = authHeader.substring(7);
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}
