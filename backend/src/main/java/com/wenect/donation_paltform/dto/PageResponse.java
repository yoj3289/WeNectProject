package com.wenect.donation_paltform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {
    private List<T> content;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int size;

    /**
     * 단순 리스트를 PageResponse로 변환 (페이징 없이 전체 반환)
     */
    public static <T> PageResponse<T> of(List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .currentPage(0)
                .totalPages(1)
                .totalElements(content.size())
                .size(content.size())
                .build();
    }
}
