package com.wenect.donation_paltform.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeleteAccountRequestDto {

    /**
     * 비밀번호 (본인 확인용)
     */
    @NotBlank(message = "비밀번호를 입력해주세요")
    private String password;

    /**
     * 탈퇴 사유 (선택사항)
     */
    private String reason;
}
