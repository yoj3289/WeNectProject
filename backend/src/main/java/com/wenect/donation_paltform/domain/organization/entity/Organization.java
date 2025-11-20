package com.wenect.donation_paltform.domain.organization.entity;

import com.wenect.donation_paltform.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orgId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String orgName;

    @Column(nullable = false, length = 50, unique = true)
    private String registrationNumber;

    @Column(length = 50)
    private String representative;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean verified = false;

    /*@Column(length = 500)
    private String documentPath;  // 인증서류 경로*/

    @Builder
    public Organization(Long orgId, User user, String orgName, String registrationNumber,
                       String representative, ApprovalStatus approvalStatus, Boolean verified) {
        this.orgId = orgId;
        this.user = user;
        this.orgName = orgName;
        this.registrationNumber = registrationNumber;
        this.representative = representative;
        this.approvalStatus = approvalStatus != null ? approvalStatus : ApprovalStatus.PENDING;
        this.verified = verified != null ? verified : false;
    }

    public enum ApprovalStatus {
        PENDING,   // 승인 대기
        APPROVED,  // 승인 완료
        REJECTED   // 승인 거부
    }
}