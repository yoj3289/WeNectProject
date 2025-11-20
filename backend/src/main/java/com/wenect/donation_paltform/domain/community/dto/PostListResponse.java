package com.wenect.donation_paltform.domain.community.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostListResponse {
    private List<PostResponse> content;
    private int totalPages;
    private long totalElements;
    private int currentPage;
    private int size;
}
