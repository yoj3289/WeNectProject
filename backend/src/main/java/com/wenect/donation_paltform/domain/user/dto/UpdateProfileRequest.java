package com.wenect.donation_paltform.domain.user.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    @NotBlank(message = "이름은 필수입니다")
    @Size(min = 2, max = 50, message = "이름은 2~50자 사이여야 합니다")
    private String userName;

    @Pattern(regexp = "^01[0-9]-[0-9]{3,4}-[0-9]{4}$", message = "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)")
    private String phone; // nullable 가능
}
