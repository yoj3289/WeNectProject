package com.wenect.donation_paltform.domain.organization.repository;

import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationDocumentRepository extends JpaRepository<OrganizationDocument, Long> {
}