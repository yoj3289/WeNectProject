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
    private Boolean isLiked; // 현재 사용자가 좋아요를 눌렀는지 여부
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long parentCommentId;
    private Long replyToCommentId; // 답글 대상 댓글 ID
    private AuthorDto replyToAuthor; // 답글 대상 사용자 정보

    @Builder.Default
    private List<CommentResponse> replies = new ArrayList<>();
}
