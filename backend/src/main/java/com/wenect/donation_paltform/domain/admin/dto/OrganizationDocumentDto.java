package com.wenect.donation_paltform.domain.admin.dto;

import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrganizationDocumentDto {
    private Long docId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String docType;
    private String uploadedAt;

    public static OrganizationDocumentDto from(OrganizationDocument document) {
        return OrganizationDocumentDto.builder()
                .docId(document.getDocId())
                .fileName(document.getFileName())
                .filePath(document.getFilePath())
                .fileSize(document.getFileSize())
                .docType(document.getDocType().name())
                .uploadedAt(document.getUploadedAt() != null
                        ? document.getUploadedAt().toString().replace("T", " ").substring(0, 16)
                        : null)
                .build();
    }
}
