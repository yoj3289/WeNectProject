package com.wenect.donation_paltform.service;

import com.wenect.donation_paltform.dto.SignupRequestDto;
import com.wenect.donation_paltform.dto.SignupResponseDto;
import com.wenect.donation_paltform.entity.User;
import com.wenect.donation_paltform.exception.DuplicateEmailException;
import com.wenect.donation_paltform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
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
}