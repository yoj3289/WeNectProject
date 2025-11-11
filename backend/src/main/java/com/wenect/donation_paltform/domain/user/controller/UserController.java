package com.wenect.donation_paltform.domain.user.controller;

import com.wenect.donation_paltform.domain.user.dto.ChangePasswordRequest;
import com.wenect.donation_paltform.domain.user.dto.UpdateProfileRequest;
import com.wenect.donation_paltform.domain.user.dto.UserProfileResponse;
import com.wenect.donation_paltform.domain.user.service.UserService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 내 프로필 조회
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @RequestHeader("Authorization") String authorizationHeader) {

        Long userId = extractUserIdFromToken(authorizationHeader);
        UserProfileResponse response = userService.getUserProfile(userId);

        return ResponseEntity.ok(
                ApiResponse.success(response, "프로필 조회 성공"));
    }

    /**
     * 내 프로필 수정
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody UpdateProfileRequest request) {

        Long userId = extractUserIdFromToken(authorizationHeader);
        UserProfileResponse response = userService.updateProfile(userId, request);

        return ResponseEntity.ok(
                ApiResponse.success(response, "프로필 수정 성공"));
    }

    /**
     * 비밀번호 변경
     */
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody ChangePasswordRequest request) {

        Long userId = extractUserIdFromToken(authorizationHeader);
        userService.changePassword(userId, request);

        return ResponseEntity.ok(
                ApiResponse.success(null, "비밀번호 변경 성공"));
    }

    /**
     * Authorization 헤더에서 사용자 ID 추출
     */
    private Long extractUserIdFromToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다");
        }

        String token = authorizationHeader.substring(7);
        return jwtTokenProvider.getUserId(token);
    }
}
