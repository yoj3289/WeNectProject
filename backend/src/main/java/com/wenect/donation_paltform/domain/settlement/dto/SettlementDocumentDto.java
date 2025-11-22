package com.wenect.donation_paltform.domain.settlement.dto;

import com.wenect.donation_paltform.domain.settlement.entity.SettlementDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 정산 서류 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementDocumentDto {

    private Long documentId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private LocalDateTime uploadedAt;

    /**
     * Entity -> DTO 변환
     */
    public static SettlementDocumentDto fromEntity(SettlementDocument document) {
        return SettlementDocumentDto.builder()
            .documentId(document.getDocumentId())
            .fileName(document.getFileName())
            .filePath(document.getFilePath())
            .fileSize(document.getFileSize())
            .documentType(document.getDocumentType())
            .uploadedAt(document.getUploadedAt())
            .build();
    }
}
