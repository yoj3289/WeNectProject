package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostImageDto {
    private Long imageId;
    private String imageUrl;
    private String fileName;
    private Long fileSize;
    private Integer displayOrder;
}
