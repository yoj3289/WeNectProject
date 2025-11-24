package com.wenect.donation_paltform.domain.project.dto;

import lombok.*;

/**
 * 프로젝트 수정 요청 DTO
 * - 제목과 소개만 수정 가능
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProjectRequest {

    private String title;       // 프로젝트 제목
    private String description; // 프로젝트 소개 (HTML)
}
