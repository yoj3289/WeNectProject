package com.wenect.donation_paltform.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendVerificationCodeResponse {

    private String message;
    private Integer expiresIn; // 유효시간(초)

    public static SendVerificationCodeResponse of(String message, Integer expiresIn) {
        return SendVerificationCodeResponse.builder()
                .message(message)
                .expiresIn(expiresIn)
                .build();
    }
}
