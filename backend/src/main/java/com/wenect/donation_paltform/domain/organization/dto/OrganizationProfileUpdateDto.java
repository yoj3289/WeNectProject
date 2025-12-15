package com.wenect.donation_paltform.domain.organization.dto;

import lombok.*;

/**
 * 기관 프로필 수정 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationProfileUpdateDto {

    /**
     * 기관 소개글
     */
    private String bio;

    /**
     * 기관명 (수정 불가 - 재심사 필요)
     */
    // private String orgName;

    /**
     * 대표자명 (수정 불가 - 재심사 필요)
     */
    // private String representative;
}
