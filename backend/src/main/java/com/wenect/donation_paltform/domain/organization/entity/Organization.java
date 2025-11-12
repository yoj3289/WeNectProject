package com.wenect.donation_paltform.domain.organization.entity;

import com.wenect.donation_paltform.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organizations")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean verified = false;
    
    /*@Column(length = 500)
    private String documentPath;  // 인증서류 경로*/
}