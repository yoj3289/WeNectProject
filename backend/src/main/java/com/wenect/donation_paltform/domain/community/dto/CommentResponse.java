package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {
    private Long commentId;
    private Long postId;
    private String content;
    private AuthorDto author;
    private Integer likeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long parentCommentId;

    @Builder.Default
    private List<CommentResponse> replies = new ArrayList<>();
}
