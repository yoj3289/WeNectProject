package com.wenect.donation_paltform.domain.organization.repository;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    // user_id로 기관 정보 조회
    Optional<Organization> findByUser_UserId(Long userId);

    // User 객체로 기관 정보 조회
    Optional<Organization> findByUser(User user);

    // 모든 기관 조회 (User 정보 함께 로드)
    @Query("SELECT o FROM Organization o JOIN FETCH o.user")
    List<Organization> findAllWithUser();
}