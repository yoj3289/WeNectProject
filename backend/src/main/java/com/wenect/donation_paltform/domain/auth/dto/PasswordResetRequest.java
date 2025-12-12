package com.wenect.donation_paltform.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 비밀번호 재설정 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    @NotBlank(message = "인증번호는 필수입니다")
    @Size(min = 6, max = 6, message = "인증번호는 6자리입니다")
    private String code;

    @NotBlank(message = "새 비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다")
    private String newPassword;

    @NotBlank(message = "비밀번호 확인은 필수입니다")
    private String confirmPassword;
}
