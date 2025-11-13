package com.wenect.donation_paltform.domain.project.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 기부 옵션 엔티티
 * 각 프로젝트마다 기부자가 선택할 수 있는 옵션을 정의
 * 예: "1명의 아동 식사 지원 - 4,000원"
 */
@Entity
@Table(name = "donation_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_id")
    private Long optionId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "option_name", nullable = false, length = 200)
    private String optionName;  // "1명의 아동 식사 지원"

    @Column(name = "option_description", length = 500)
    private String optionDescription;  // "1명의 아동에게 따뜻한 한 끼를 제공합니다"

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;  // 4000.00

    @Column(name = "icon_emoji", length = 10)
    private String iconEmoji;  // "🍚"

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;  // 표시 순서

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;  // 활성화 여부

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
