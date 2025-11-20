package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long postId;
    private String type;
    private String title;
    private String content;
    private AuthorDto author;
    private Integer viewCount;
    private Integer likeCount;
    private Long commentCount;
    private Boolean isPinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PostImageDto> images;
}
