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
import com.wenect.donation_paltform.domain.auth.service.AuthService;
import com.wenect.donation_paltform.domain.auth.service.EmailVerificationService;
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
            @RequestPart(value = "file", required = false) MultipartFile file) {
        SignupResponseDto responseDto = authService.signup(dto, file);
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
            @Valid @RequestBody LoginRequestDto dto) {
        LoginResponseDto responseDto = authService.login(dto);
        ApiResponse<LoginResponseDto> response = ApiResponse.success(responseDto, "로그인 성공");

        return ResponseEntity.ok(response);
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

}