package com.wenect.donation_paltform.repository;

import com.wenect.donation_paltform.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
}