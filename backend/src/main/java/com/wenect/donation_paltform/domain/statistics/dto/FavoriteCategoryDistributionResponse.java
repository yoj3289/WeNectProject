package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 관심 카테고리 분포 응답 DTO
 * 카테고리별 기부한 프로젝트 수 분포
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteCategoryDistributionResponse {

    /**
     * 카테고리 ID
     */
    private Integer categoryId;

    /**
     * 카테고리 이름
     */
    private String categoryName;

    /**
     * 기부한 프로젝트 수
     */
    private Integer projectCount;

    /**
     * 전체 프로젝트 대비 비율 (%)
     */
    private Double percentage;
}
