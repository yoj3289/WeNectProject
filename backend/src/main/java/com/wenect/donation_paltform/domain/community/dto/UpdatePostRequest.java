package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePostRequest {
    private String title;
    private String content;
    private List<Long> removeImageIds; // 삭제할 이미지 ID 목록
}
