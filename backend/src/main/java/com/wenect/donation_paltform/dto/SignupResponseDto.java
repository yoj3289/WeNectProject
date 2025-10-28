package com.wenect.donation_paltform.dto;

import com.wenect.donation_paltform.entity.User;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupResponseDto {
    
    private Long userId;
    private String email;
    private String userName;
    private String userType;
    
    public static SignupResponseDto from(User user) {
        return SignupResponseDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .userName(user.getUserName())
                .userType(user.getUserType().name())
                .build();
    }
}