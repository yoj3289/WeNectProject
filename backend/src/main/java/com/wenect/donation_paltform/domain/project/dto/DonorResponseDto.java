package com.wenect.donation_paltform.domain.project.dto;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 기부자 응답 DTO (프론트엔드 호환용)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorResponseDto {

    private Long id;
    private String name;
    private BigDecimal amount;
    private String date;
    private Boolean isAnonymous;
    private String message;

    /**
     * Donation Entity를 DonorResponseDto로 변환
     */
    public static DonorResponseDto from(Donation donation) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        return DonorResponseDto.builder()
                .id(donation.getDonationId())
                .name(Boolean.TRUE.equals(donation.getIsAnonymous()) ? "익명" : donation.getDonorName())
                .amount(donation.getAmount())
                .date(donation.getCreatedAt() != null ? donation.getCreatedAt().format(formatter) : "")
                .isAnonymous(donation.getIsAnonymous())
                .message(donation.getMessage())
                .build();
    }
}
