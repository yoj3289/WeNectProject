package com.wenect.donation_paltform.dto;

import com.wenect.donation_paltform.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDto {
    
    private String token;
    private UserInfo user;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long userId;
        private String email;
        private String userName;
        private String userType;
        private String phone;
    }
    
    public static LoginResponseDto of(String token, User user) {
        return LoginResponseDto.builder()
                .token(token)
                .user(UserInfo.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .userName(user.getUserName())
                        .userType(user.getUserType().name().toLowerCase()) // 소문자로 변환
                        .phone(user.getPhone())
                        .build())
                .build();
    }
}