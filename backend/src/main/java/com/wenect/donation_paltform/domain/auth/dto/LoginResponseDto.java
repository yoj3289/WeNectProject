package com.wenect.donation_paltform.domain.auth.dto;

import com.wenect.donation_paltform.domain.auth.entity.User;
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
    private Boolean isRejected; // 승인 거부 여부
    private RejectionInfo rejectionInfo; // 거부 정보
    private Boolean profileIncomplete; // 프로필 미완성 여부 (이미지 미등록 등)

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
        private String profileImage; // 프로필 이미지 URL
        private String organizationName; // 기관명 (기관 사용자인 경우)
        private String businessNumber; // 사업자번호 (기관 사용자인 경우)
        private String representativeName; // 대표자명 (기관 사용자인 경우)
        private String createdAt; // 가입일 (함께한 일수 계산용)
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RejectionInfo {
        private String rejectionReason; // 거부 사유
        private String rejectionFields; // 거부된 필드 목록 (JSON)
        private String lastRejectedAt; // 마지막 거부 일시
    }
    
    public static LoginResponseDto of(String token, User user, String organizationName) {
        // 기관 사용자의 경우 프로필 이미지 미등록 시 미완성 표시
        boolean profileIncomplete = user.getUserType() == User.UserType.ORGANIZATION
                && (user.getProfileImage() == null || user.getProfileImage().isEmpty());

        return LoginResponseDto.builder()
                .token(token)
                .user(UserInfo.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .userName(user.getUserName())
                        .userType(user.getUserType().name().toLowerCase()) // 소문자로 변환
                        .phone(user.getPhone())
                        .profileImage(user.getProfileImage())
                        .organizationName(organizationName)
                        .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                        .build())
                .isRejected(false)
                .profileIncomplete(profileIncomplete)
                .build();
    }

    public static LoginResponseDto ofRejected(User user,
                                             String organizationName,
                                             String businessNumber,
                                             String representativeName,
                                             String rejectionReason,
                                             String rejectionFields,
                                             java.time.LocalDateTime lastRejectedAt) {
        return LoginResponseDto.builder()
                .token(null) // 거부된 사용자는 토큰 발급 안 함
                .user(UserInfo.builder()
                        .userId(user.getUserId())
                        .email(user.getEmail())
                        .userName(user.getUserName())
                        .userType(user.getUserType().name().toLowerCase())
                        .phone(user.getPhone())
                        .profileImage(user.getProfileImage())
                        .organizationName(organizationName)
                        .businessNumber(businessNumber)
                        .representativeName(representativeName)
                        .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                        .build())
                .isRejected(true)
                .profileIncomplete(false)
                .rejectionInfo(RejectionInfo.builder()
                        .rejectionReason(rejectionReason)
                        .rejectionFields(rejectionFields)
                        .lastRejectedAt(lastRejectedAt != null ? lastRejectedAt.toString() : null)
                        .build())
                .build();
    }
}