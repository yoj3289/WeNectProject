package com.wenect.donation_paltform.global.common;

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

    /**
     * Page 정보를 포함한 PageResponse 생성
     */
    public static <T> PageResponse<T> of(List<T> content, int currentPage, int totalPages, long totalElements, int size) {
        PageResponse<T> response = new PageResponse<>();
        response.content = content;
        response.currentPage = currentPage;
        response.totalPages = totalPages;
        response.totalElements = totalElements;
        response.size = size;
        return response;
    }
}
