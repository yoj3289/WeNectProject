package com.wenect.donation_paltform.domain.organization.dto;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 기관 프로필 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationProfileResponseDto {

    private Long orgId;
    private String orgName;
    private String registrationNumber;
    private String representative;
    private String email;
    private String phone;
    private String profileImage;
    private String bio;
    private String approvalStatus;
    private Boolean verified;
    private LocalDateTime createdAt;
    private Boolean profileIncomplete;  // 프로필 미완성 여부 (이미지 미등록 등)

    public static OrganizationProfileResponseDto from(Organization organization, User user) {
        boolean profileIncomplete = user.getProfileImage() == null || user.getProfileImage().isEmpty();

        return OrganizationProfileResponseDto.builder()
                .orgId(organization.getOrgId())
                .orgName(organization.getOrgName())
                .registrationNumber(organization.getRegistrationNumber())
                .representative(organization.getRepresentative())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImage(user.getProfileImage())
                .bio(user.getBio())
                .approvalStatus(organization.getApprovalStatus().name())
                .verified(organization.getVerified())
                .createdAt(user.getCreatedAt())
                .profileIncomplete(profileIncomplete)
                .build();
    }
}
