package com.wenect.donation_paltform.domain.user.controller;

import com.wenect.donation_paltform.domain.user.dto.ChangePasswordRequest;
import com.wenect.donation_paltform.domain.user.dto.DeleteAccountRequestDto;
import com.wenect.donation_paltform.domain.user.dto.NotificationSettingsDto;
import com.wenect.donation_paltform.domain.user.dto.UpdateProfileRequest;
import com.wenect.donation_paltform.domain.user.dto.UserProfileResponse;
import com.wenect.donation_paltform.domain.user.service.UserService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
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
     * 알림 설정 조회
     */
    @GetMapping("/notification-settings")
    public ResponseEntity<NotificationSettingsDto> getNotificationSettings(
            @RequestHeader("Authorization") String authorizationHeader) {

        Long userId = extractUserIdFromToken(authorizationHeader);
        NotificationSettingsDto settings = userService.getNotificationSettings(userId);

        return ResponseEntity.ok(settings);
    }

    /**
     * 알림 설정 업데이트
     */
    @PutMapping("/notification-settings")
    public ResponseEntity<NotificationSettingsDto> updateNotificationSettings(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody NotificationSettingsDto settings) {

        Long userId = extractUserIdFromToken(authorizationHeader);
        NotificationSettingsDto updatedSettings = userService.updateNotificationSettings(userId, settings);

        return ResponseEntity.ok(updatedSettings);
    }

    /**
     * 회원 탈퇴
     * - 비밀번호 확인 필수
     * - 30일간 유예 기간 (소프트 삭제)
     * - IP 주소 및 User Agent 로깅 (법적 증거용)
     */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody DeleteAccountRequestDto request,
            HttpServletRequest httpServletRequest) {

        Long userId = extractUserIdFromToken(authorizationHeader);
        String ipAddress = getClientIpAddress(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        userService.deleteAccount(userId, request, ipAddress, userAgent);

        return ResponseEntity.ok(
                ApiResponse.success(null, "회원 탈퇴가 완료되었습니다. 30일 후 데이터가 영구 삭제됩니다."));
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

    /**
     * 클라이언트의 실제 IP 주소 추출
     * 프록시나 로드 밸런서를 통한 요청도 고려
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // X-Forwarded-For에 여러 IP가 있는 경우 첫 번째 IP 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }
}
