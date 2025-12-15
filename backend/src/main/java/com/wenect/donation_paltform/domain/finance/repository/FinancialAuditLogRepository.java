package com.wenect.donation_paltform.domain.finance.repository;

import com.wenect.donation_paltform.domain.finance.entity.FinancialAuditLog;
import com.wenect.donation_paltform.domain.finance.entity.FinancialAuditLog.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FinancialAuditLogRepository extends JpaRepository<FinancialAuditLog, Long> {

    /**
     * 특정 엔티티의 감사 로그 조회
     */
    List<FinancialAuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType, Long entityId);

    /**
     * 특정 행동의 감사 로그 조회
     */
    Page<FinancialAuditLog> findByActionOrderByCreatedAtDesc(AuditAction action, Pageable pageable);

    /**
     * 특정 수행자의 감사 로그 조회
     */
    Page<FinancialAuditLog> findByPerformedByOrderByCreatedAtDesc(Long performedBy, Pageable pageable);

    /**
     * 특정 기간의 감사 로그 조회
     */
    Page<FinancialAuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDateTime, LocalDateTime endDateTime, Pageable pageable);

    /**
     * 프로젝트별 감사 로그 조회
     */
    List<FinancialAuditLog> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    /**
     * 기관별 감사 로그 조회
     */
    List<FinancialAuditLog> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    /**
     * 특정 IP의 감사 로그 조회 (보안 분석용)
     */
    List<FinancialAuditLog> findByIpAddressOrderByCreatedAtDesc(String ipAddress);

    /**
     * 특정 엔티티 + 행동의 최신 로그 조회
     */
    List<FinancialAuditLog> findByEntityTypeAndEntityIdAndActionOrderByCreatedAtDesc(
            String entityType, Long entityId, AuditAction action);
}
