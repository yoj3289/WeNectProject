package com.wenect.donation_paltform.domain.auth.controller;

import com.wenect.donation_paltform.global.common.ApiResponse;
import com.wenect.donation_paltform.domain.auth.dto.LoginRequestDto;
import com.wenect.donation_paltform.domain.auth.dto.LoginResponseDto;
import com.wenect.donation_paltform.domain.auth.dto.SignupRequestDto;
import com.wenect.donation_paltform.domain.auth.dto.SignupResponseDto;
import com.wenect.donation_paltform.domain.auth.service.AuthService;
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

}