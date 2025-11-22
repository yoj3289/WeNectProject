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
    @Column(name = "document_id")
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false, foreignKey = @ForeignKey(name = "FK_settlement_documents"))
    private Settlement settlement;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize; // bytes

    @Column(name = "document_type", length = 50)
    private String documentType; // 서류 유형 (예: 사업자등록증, 통장사본 등)

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
