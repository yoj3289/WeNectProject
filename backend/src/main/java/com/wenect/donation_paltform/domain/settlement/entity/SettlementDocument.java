package com.wenect.donation_paltform.domain.settlement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 정산 서류 엔티티
 * 정산 요청 시 첨부되는 서류 정보를 관리
 */
@Entity
@Table(name = "settlement_documents", indexes = {
    @Index(name = "IDX_settlement_docs", columnList = "settlement_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doc_id")
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false, foreignKey = @ForeignKey(name = "FK_settlement_docs"))
    private Settlement settlement;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize; // bytes

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 50)
    private DocumentType documentType; // 서류 유형

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    /**
     * 정산 서류 유형
     */
    public enum DocumentType {
        ACCOUNT_COPY,   // 통장사본
        USAGE_REPORT,   // 사용 보고서
        INVOICE,        // 지출 증빙서류
        OTHER           // 기타
    }
}
