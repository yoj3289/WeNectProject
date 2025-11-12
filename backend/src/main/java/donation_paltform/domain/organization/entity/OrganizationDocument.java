package com.wenect.donation_paltform.domain.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organization_documents")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long docId;

    @ManyToOne
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocType docType;
    
    @Column(nullable = false, length = 255)
    private String fileName;  // 원본 파일명
    
    @Column(nullable = false, length = 500)
    private String filePath;  // 저장 경로
    
    @Column(nullable = false)
    private Long fileSize;    // 파일 크기
    
    /*@Column(nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();*/

    @Column(name = "uploaded_at", nullable = false)
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @PrePersist
    private void prePersist() {
        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }
    }

    
    public enum DocType {
        BUSINESS_LICENSE,        // 사업자등록증
        REGISTRATION_CERTIFICATE, // 인증서류
        BANK_STATEMENT,          // 통장사본
        OTHER                    // 기타
    }
}
