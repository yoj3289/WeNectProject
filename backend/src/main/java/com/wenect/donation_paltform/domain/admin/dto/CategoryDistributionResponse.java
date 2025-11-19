package com.wenect.donation_paltform.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDistributionResponse {

    private String name;      // 카테고리 이름
    private Long count;       // 해당 카테고리의 프로젝트 수
    private Double percent;   // 전체 대비 비율 (%)
    private String color;     // 차트 색상
}
