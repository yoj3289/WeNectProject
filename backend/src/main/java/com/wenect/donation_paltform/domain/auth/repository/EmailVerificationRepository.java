package com.wenect.donation_paltform.domain.auth.repository;

import com.wenect.donation_paltform.domain.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    /**
     * 이메일로 가장 최근 인증 정보 조회 (생성 시간 기준 내림차순)
     */
    Optional<EmailVerification> findTopByEmailOrderByCreatedAtDesc(String email);

    /**
     * 이메일로 검증된 인증 정보가 있는지 확인
     */
    boolean existsByEmailAndIsVerifiedTrue(String email);

    /**
     * 만료되지 않은 인증 정보 삭제 (같은 이메일 재발송 시 사용)
     */
    void deleteByEmailAndIsVerifiedFalse(String email);

    /**
     * 해당 이메일의 모든 인증 정보 삭제 (재테스트용)
     */
    void deleteByEmail(String email);

    /**
     * 만료된 인증 정보 삭제 (배치 작업용)
     */
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
