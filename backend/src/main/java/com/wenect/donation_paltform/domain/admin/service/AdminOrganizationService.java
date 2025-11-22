package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.OrganizationApprovalResponse;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationDocumentRepository;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationDocumentRepository documentRepository;

    /**
     * 모든 기관 목록 조회 (승인 상태별)
     */
    public List<OrganizationApprovalResponse> getAllOrganizations(String statusFilter) {
        List<Organization> organizations;

        // 상태별 필터링 (User 정보 함께 로드)
        if (statusFilter != null && !statusFilter.equals("all")) {
            Organization.ApprovalStatus status = Organization.ApprovalStatus.valueOf(statusFilter.toUpperCase());
            organizations = organizationRepository.findAllWithUser().stream()
                    .filter(org -> org.getApprovalStatus() == status)
                    .collect(Collectors.toList());
        } else {
            organizations = organizationRepository.findAllWithUser();
        }

        // DTO 변환
        return organizations.stream()
                .map(org -> {
                    List<OrganizationDocument> docs = documentRepository.findByOrganization_OrgId(org.getOrgId());
                    return OrganizationApprovalResponse.from(org, docs);
                })
                .collect(Collectors.toList());
    }

    /**
     * 승인 상태별 개수 조회
     */
    public long countByStatus(Organization.ApprovalStatus status) {
        return organizationRepository.findAllWithUser().stream()
                .filter(org -> org.getApprovalStatus() == status)
                .count();
    }

    /**
     * 기관 승인
     */
    @Transactional
    public void approveOrganization(Long userId) {
        Organization org = organizationRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));

        org.setApprovalStatus(Organization.ApprovalStatus.APPROVED);
        organizationRepository.save(org);
    }

    /**
     * 기관 거부
     */
    @Transactional
    public void rejectOrganization(Long userId, String rejectionReason) {
        Organization org = organizationRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));

        org.setApprovalStatus(Organization.ApprovalStatus.REJECTED);
        // TODO: 거절 사유는 나중에 Organization 엔티티에 필드 추가 시 저장
        organizationRepository.save(org);
    }
}
