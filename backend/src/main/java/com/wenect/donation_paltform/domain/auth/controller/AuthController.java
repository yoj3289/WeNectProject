package com.wenect.donation_paltform.domain.auth.controller;

import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.domain.auth.dto.LoginRequestDto;
import com.wenect.donation_paltform.domain.auth.dto.LoginResponseDto;
import com.wenect.donation_paltform.domain.auth.dto.SignupRequestDto;
import com.wenect.donation_paltform.domain.auth.dto.SignupResponseDto;
import com.wenect.donation_paltform.domain.auth.dto.SendVerificationCodeRequest;
import com.wenect.donation_paltform.domain.auth.dto.SendVerificationCodeResponse;
import com.wenect.donation_paltform.domain.auth.dto.VerifyCodeRequest;
import com.wenect.donation_paltform.domain.auth.dto.VerifyCodeResponse;
import com.wenect.donation_paltform.domain.auth.dto.CheckEmailExistsRequest;
import com.wenect.donation_paltform.domain.auth.dto.PasswordResetRequest;
import com.wenect.donation_paltform.domain.auth.dto.PasswordResetResponse;
import com.wenect.donation_paltform.domain.auth.service.AuthService;
import com.wenect.donation_paltform.domain.auth.service.EmailVerificationService;
import com.wenect.donation_paltform.domain.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


// import 추가 (파일 최상단 import 섹션에)
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;

    /*
     * // 회원가입 API
     * 
     * @PostMapping("/signup")
     * public ResponseEntity<ApiResponse<SignupResponseDto>> signup(
     * 
     * @Valid @RequestBody SignupRequestDto dto
     * ) {
     * SignupResponseDto responseDto = authService.signup(dto);
     * ApiResponse<SignupResponseDto> response =
     * ApiResponse.success(responseDto, "회원가입이 완료되었습니다");
     * 
     * return ResponseEntity.ok(response);
     * }
     */

    // AuthController.java에 추가

    // 기관회원가입
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponseDto>> signup(
            @Valid @RequestPart("data") SignupRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
        SignupResponseDto responseDto = authService.signup(dto, file, profileImage);
        ApiResponse<SignupResponseDto> response = ApiResponse.success(responseDto, "회원가입이 완료되었습니다");

        return ResponseEntity.ok(response);
    }

    // 이메일 중복 확인 API
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(
            @RequestParam("email") String email) {
        boolean isDuplicate = authService.checkEmailDuplicate(email);
        ApiResponse<Boolean> response = ApiResponse.success(
                !isDuplicate, // 사용 가능하면 true
                isDuplicate ? "이미 사용 중인 이메일입니다" : "사용 가능한 이메일입니다");

        return ResponseEntity.ok(response);
    }

    // 로그인 API 추가
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(
            @Valid @RequestBody LoginRequestDto dto,
            jakarta.servlet.http.HttpServletRequest request) {
        String ipAddress = getClientIp(request);
        LoginResponseDto responseDto = authService.login(dto, ipAddress);
        ApiResponse<LoginResponseDto> response = ApiResponse.success(responseDto, "로그인 성공");

        return ResponseEntity.ok(response);
    }

    /**
     * 클라이언트 IP 주소 추출 (프록시 고려)
     */
    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For에 여러 IP가 있을 경우 첫 번째 IP만 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    // 로그아웃 API
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // JWT 토큰 방식이므로 서버에서는 별도 처리 불필요
        // 클라이언트에서 토큰 삭제로 로그아웃 처리
        ApiResponse<Void> response = ApiResponse.success(null, "로그아웃 성공");
        return ResponseEntity.ok(response);
    }

    // 이메일 인증번호 발송 API
    @PostMapping("/email/send-code")
    public ResponseEntity<ApiResponse<SendVerificationCodeResponse>> sendVerificationCode(
            @Valid @RequestBody SendVerificationCodeRequest request) {
        emailVerificationService.sendVerificationCode(request.getEmail());
        SendVerificationCodeResponse responseDto = SendVerificationCodeResponse.of(
                "인증번호가 발송되었습니다",
                300 // 5분 = 300초
        );
        ApiResponse<SendVerificationCodeResponse> response = ApiResponse.success(
                responseDto,
                "인증번호가 이메일로 발송되었습니다"
        );
        return ResponseEntity.ok(response);
    }

    // 이메일 인증번호 확인 API
    @PostMapping("/email/verify-code")
    public ResponseEntity<ApiResponse<VerifyCodeResponse>> verifyCode(
            @Valid @RequestBody VerifyCodeRequest request) {
        EmailVerificationService.VerificationResult result = emailVerificationService.verifyCode(
                request.getEmail(),
                request.getCode()
        );

        VerifyCodeResponse responseDto;
        if (result.isSuccess()) {
            responseDto = VerifyCodeResponse.success(result.getMessage());
        } else {
            responseDto = VerifyCodeResponse.failure(result.getMessage(), result.getRemainingSeconds());
        }

        ApiResponse<VerifyCodeResponse> response = ApiResponse.success(
                responseDto,
                result.getMessage()
        );
        return ResponseEntity.ok(response);
    }

    // 토큰 갱신 API (세션 연장)
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponseDto>> refreshToken(
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body(
                    ApiResponse.error("인증 정보가 없습니다", "UNAUTHORIZED")
            );
        }

        Long userId = (Long) authentication.getPrincipal();
        LoginResponseDto responseDto = authService.refreshToken(userId);
        ApiResponse<LoginResponseDto> response = ApiResponse.success(responseDto, "토큰이 갱신되었습니다");

        return ResponseEntity.ok(response);
    }

    // ==================== 비밀번호 찾기/재설정 API ====================

    /**
     * 비밀번호 찾기 - 이메일 존재 여부 확인
     */
    @PostMapping("/password/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailExists(
            @Valid @RequestBody CheckEmailExistsRequest request) {
        boolean exists = passwordResetService.isEmailExists(request.getEmail());
        ApiResponse<Boolean> response = ApiResponse.success(
                exists,
                exists ? "가입된 이메일입니다" : "가입되지 않은 이메일입니다"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 찾기 - 인증번호 발송
     */
    @PostMapping("/password/send-code")
    public ResponseEntity<ApiResponse<SendVerificationCodeResponse>> sendPasswordResetCode(
            @Valid @RequestBody SendVerificationCodeRequest request) {
        passwordResetService.sendPasswordResetCode(request.getEmail());
        SendVerificationCodeResponse responseDto = SendVerificationCodeResponse.of(
                "인증번호가 발송되었습니다",
                300 // 5분 = 300초
        );
        ApiResponse<SendVerificationCodeResponse> response = ApiResponse.success(
                responseDto,
                "비밀번호 재설정 인증번호가 이메일로 발송되었습니다"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 찾기 - 인증번호 확인
     */
    @PostMapping("/password/verify-code")
    public ResponseEntity<ApiResponse<VerifyCodeResponse>> verifyPasswordResetCode(
            @Valid @RequestBody VerifyCodeRequest request) {
        PasswordResetService.VerificationResult result = passwordResetService.verifyPasswordResetCode(
                request.getEmail(),
                request.getCode()
        );

        VerifyCodeResponse responseDto;
        if (result.isSuccess()) {
            responseDto = VerifyCodeResponse.success(result.getMessage());
        } else {
            responseDto = VerifyCodeResponse.failure(result.getMessage(), result.getRemainingSeconds());
        }

        ApiResponse<VerifyCodeResponse> response = ApiResponse.success(
                responseDto,
                result.getMessage()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 비밀번호 재설정
     */
    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<PasswordResetResponse>> resetPassword(
            @Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.resetPassword(request);
        PasswordResetResponse responseDto = PasswordResetResponse.success("비밀번호가 성공적으로 변경되었습니다");
        ApiResponse<PasswordResetResponse> response = ApiResponse.success(
                responseDto,
                "비밀번호가 성공적으로 변경되었습니다"
        );
        return ResponseEntity.ok(response);
    }

}