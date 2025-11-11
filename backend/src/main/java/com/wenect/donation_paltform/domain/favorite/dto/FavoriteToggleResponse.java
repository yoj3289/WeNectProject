package com.wenect.donation_paltform.domain.favorite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 관심 프로젝트 토글 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteToggleResponse {

    /**
     * 관심 프로젝트 등록 여부 (true: 등록됨, false: 제거됨)
     */
    private Boolean isFavorite;

    /**
     * 응답 메시지
     */
    private String message;
}
