package com.wenect.donation_paltform.domain.admin.dto;

import com.wenect.donation_paltform.domain.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
    private Long userId;
    private String userName;
    private String email;
    private String userType;
    private String status;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 기관 회원인 경우 추가 정보
    private String organizationName;
    private Boolean verified;

    public static UserListResponse from(User user, String organizationName, Boolean verified) {
        return UserListResponse.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .email(user.getEmail())
                .userType(user.getUserType().name())
                .status(user.getStatus().name())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .organizationName(organizationName)
                .verified(verified)
                .build();
    }
}
