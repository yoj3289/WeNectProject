package com.wenect.donation_paltform.domain.organization.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationListResponse {

    @JsonProperty("id")
    private Long orgId;

    private String orgName;

    private String representative;

    @JsonProperty("description")
    private String description; // 기관 소개 (User.bio에서 가져옴)

    @JsonProperty("logoUrl")
    private String logoUrl; // 기관 로고 이미지 (User.profileImage에서 가져옴)

    private Integer totalProjects; // 총 프로젝트 수

    private Integer activeProjects; // 진행 중인 프로젝트 수

    private BigDecimal totalFunded; // 총 모금액

    private LocalDateTime createdAt;
}
