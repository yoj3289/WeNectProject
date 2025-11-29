package com.wenect.donation_paltform.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyCodeResponse {

    private Boolean verified;
    private String message;
    private Long remainingSeconds; // 남은 시간(초) - 실패 시 표시

    public static VerifyCodeResponse success(String message) {
        return VerifyCodeResponse.builder()
                .verified(true)
                .message(message)
                .build();
    }

    public static VerifyCodeResponse failure(String message, Long remainingSeconds) {
        return VerifyCodeResponse.builder()
                .verified(false)
                .message(message)
                .remainingSeconds(remainingSeconds)
                .build();
    }
}
