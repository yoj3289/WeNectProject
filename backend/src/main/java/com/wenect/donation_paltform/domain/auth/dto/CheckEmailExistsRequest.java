package com.wenect.donation_paltform.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 이메일 존재 여부 확인 요청 DTO (비밀번호 찾기용)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CheckEmailExistsRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;
}
