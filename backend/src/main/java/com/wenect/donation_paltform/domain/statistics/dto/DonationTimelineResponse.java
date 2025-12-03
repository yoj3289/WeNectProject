package com.wenect.donation_paltform.domain.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 기부 타임라인 응답 DTO
 * 시간순 기부 내역
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationTimelineResponse {

    /**
     * 기부 ID
     */
    private Long donationId;

    /**
     * 기부 시간
     */
    private LocalDateTime donatedAt;

    /**
     * 기부 금액
     */
    private BigDecimal amount;

    /**
     * 프로젝트 제목
     */
    private String projectTitle;

    /**
     * 카테고리 ID
     */
    private Integer categoryId;

    /**
     * 카테고리 이름
     */
    private String categoryName;
}
