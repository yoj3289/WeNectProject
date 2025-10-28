package com.wenect.donation_paltform.controller;

import com.wenect.donation_paltform.dto.ApiResponse;
import com.wenect.donation_paltform.dto.SignupRequestDto;
import com.wenect.donation_paltform.dto.SignupResponseDto;
import com.wenect.donation_paltform.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    // 회원가입 API
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponseDto>> signup(
            @Valid @RequestBody SignupRequestDto dto
    ) {
        SignupResponseDto responseDto = authService.signup(dto);
        ApiResponse<SignupResponseDto> response = 
            ApiResponse.success(responseDto, "회원가입이 완료되었습니다");
        
        return ResponseEntity.ok(response);
    }
    
    // 이메일 중복 확인 API
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(
            @RequestParam("email") String email 
    ) {
        boolean isDuplicate = authService.checkEmailDuplicate(email);
        ApiResponse<Boolean> response = ApiResponse.success(
            !isDuplicate,  // 사용 가능하면 true
            isDuplicate ? "이미 사용 중인 이메일입니다" : "사용 가능한 이메일입니다"
        );
        
        return ResponseEntity.ok(response);
    }
}