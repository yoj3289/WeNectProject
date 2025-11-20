package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorDto {
    private Long userId;
    private String userName;
    private String userType;
}
