package com.wenect.donation_paltform.dto;

import com.wenect.donation_paltform.entity.User.UserType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequestDto {
    
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;
    
    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다")
    @Pattern(regexp = ".*[!@#$%^&*(),.?\":{}|<>].*", 
             message = "비밀번호는 특수문자를 포함해야 합니다")
    private String password;
    
    @NotBlank(message = "이름은 필수입니다")
    private String userName;
    
    @Pattern(regexp = "^\\d{3}-\\d{4}-\\d{4}$", 
             message = "전화번호 형식이 올바르지 않습니다")
    private String phone;
    
    @NotNull(message = "사용자 유형은 필수입니다")
    private UserType userType;
}