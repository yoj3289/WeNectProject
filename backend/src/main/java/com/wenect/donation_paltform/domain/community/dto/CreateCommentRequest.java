package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommentRequest {
    private String content;
    private Long parentCommentId;
    private Long replyToCommentId; // 답글 대상 댓글 ID (대댓글에 답글 시 사용)
}
