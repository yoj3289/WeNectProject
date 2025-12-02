package com.wenect.donation_paltform.domain.donation.dto;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 홈페이지 후기 섹션용 Featured 메시지 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedMessageResponse {

    private Long donationId;
    private String message;        // 응원 메시지
    private String donorName;      // 기부자 이름
    private String projectTitle;   // 프로젝트 제목
    private LocalDateTime donatedAt;  // 기부 시간
    private Boolean isFeatured;    // 관리자 선정 여부

    /**
     * Entity를 DTO로 변환
     */
    public static FeaturedMessageResponse from(Donation donation, String projectTitle) {
        return FeaturedMessageResponse.builder()
                .donationId(donation.getDonationId())
                .message(donation.getMessage())
                .donorName(donation.getIsAnonymous() ? "익명의 기부자" : donation.getDonorName())
                .projectTitle(projectTitle)
                .donatedAt(donation.getDonatedAt())
                .isFeatured(donation.getIsFeatured())
                .build();
    }
}
