package com.wenect.donation_paltform.repository;

import com.wenect.donation_paltform.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    // user_id로 기관 정보 조회
    Optional<Organization> findByUser_UserId(Long userId);
}