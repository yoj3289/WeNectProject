package com.wenect.donation_paltform.domain.organization.repository;

import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationDocumentRepository extends JpaRepository<OrganizationDocument, Long> {

    // 기관 ID로 서류 목록 조회
    List<OrganizationDocument> findByOrganization_OrgId(Long orgId);
}