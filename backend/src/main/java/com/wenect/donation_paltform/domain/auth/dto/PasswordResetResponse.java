package com.wenect.donation_paltform.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 비밀번호 재설정 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetResponse {

    private boolean success;
    private String message;

    public static PasswordResetResponse success(String message) {
        return PasswordResetResponse.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static PasswordResetResponse failure(String message) {
        return PasswordResetResponse.builder()
                .success(false)
                .message(message)
                .build();
    }
}
