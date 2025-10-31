package com.wenect.donation_paltform.service;

import com.wenect.donation_paltform.dto.LoginRequestDto;
import com.wenect.donation_paltform.dto.LoginResponseDto;
import com.wenect.donation_paltform.dto.SignupRequestDto;
import com.wenect.donation_paltform.dto.SignupResponseDto;
import com.wenect.donation_paltform.entity.User;
import com.wenect.donation_paltform.exception.DuplicateEmailException;
import com.wenect.donation_paltform.repository.UserRepository;
import com.wenect.donation_paltform.util.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final JwtTokenProvider jwtTokenProvider;  //251031추간


    
    @Transactional
    public SignupResponseDto signup(SignupRequestDto dto) {
        // 1. 이메일 중복 확인
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateEmailException();
        }
        
        // 2. User 엔티티 생성
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))  // 비밀번호 암호화
                .userName(dto.getUserName())
                .phone(dto.getPhone())
                .userType(dto.getUserType())
                .build();
        
        // 3. DB 저장
        User savedUser = userRepository.save(user);
        
        // 4. 응답 DTO 변환
        return SignupResponseDto.from(savedUser);
    }
    
    // 이메일 중복 체크 API용
    public boolean checkEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    // 로그인 메서드 추가
    @Transactional(readOnly = true)
    public LoginResponseDto login(LoginRequestDto dto) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다"));
        
        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다");
        }
        
        // 3. 계정 상태 확인
        if (user.getStatus() == User.UserStatus.SUSPENDED) {
            throw new IllegalStateException("정지된 계정입니다. 관리자에게 문의하세요");
        }
        
        if (user.getStatus() == User.UserStatus.INACTIVE) {
            throw new IllegalStateException("비활성화된 계정입니다");
        }
        
        // 4. JWT 토큰 생성
        String token = jwtTokenProvider.createToken(
                user.getUserId(),
                user.getEmail(),
                user.getUserType().name()
        );
        
        // 5. 응답 DTO 반환
        return LoginResponseDto.of(token, user);
    }
}