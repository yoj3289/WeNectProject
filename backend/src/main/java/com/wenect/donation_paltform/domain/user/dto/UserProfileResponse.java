package com.wenect.donation_paltform.domain.user.dto;

import com.wenect.donation_paltform.domain.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long userId;
    private String email;
    private String userName;
    private String phone;
    private String userType;
    private LocalDateTime createdAt;

    public static UserProfileResponse from(User user) {
        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .userName(user.getUserName())
                .phone(user.getPhone())
                .userType(user.getUserType().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
