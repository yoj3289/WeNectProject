package com.wenect.donation_paltform.domain.admin.dto;

import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class OrganizationApprovalResponse {
    private Long orgId;
    private Long userId;
    private String userName;
    private String email;
    private String phone;
    private String organizationName;
    private String businessNumber;
    private String representativeName;
    private List<OrganizationDocumentDto> documents;
    private String status; // pending, approved, rejected
    private String appliedDate;
    private String processedDate;
    private String rejectionReason;

    public static OrganizationApprovalResponse from(
            Organization org,
            List<OrganizationDocument> documents
    ) {
        String status = org.getApprovalStatus().name().toLowerCase();

        return OrganizationApprovalResponse.builder()
                .orgId(org.getOrgId())
                .userId(org.getUser().getUserId())
                .userName(org.getUser().getUserName())
                .email(org.getUser().getEmail())
                .phone(org.getUser().getPhone())
                .organizationName(org.getOrgName())
                .businessNumber(org.getRegistrationNumber())
                .representativeName(org.getRepresentative())
                .documents(documents.stream()
                        .map(OrganizationDocumentDto::from)
                        .collect(Collectors.toList()))
                .status(status)
                .appliedDate(formatDateTime(org.getUser().getCreatedAt()))
                .processedDate(org.getUser().getUpdatedAt() != null && !status.equals("pending")
                        ? formatDateTime(org.getUser().getUpdatedAt())
                        : null)
                .rejectionReason(org.getRejectionReason())
                .build();
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.toString().replace("T", " ").substring(0, 16);
    }
}
