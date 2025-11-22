package com.wenect.donation_paltform.domain.piggybank.repository;

import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 저금통 Repository
 */
@Repository
public interface PiggyBankRepository extends JpaRepository<PiggyBank, Long> {

    /**
     * 프로젝트 ID로 저금통 조회
     */
    Optional<PiggyBank> findByProjectId(Long projectId);

    /**
     * 프로젝트 ID로 저금통 존재 여부 확인
     */
    boolean existsByProjectId(Long projectId);

    /**
     * 상태별 저금통 목록 조회
     */
    List<PiggyBank> findByStatus(PiggyBank.PiggyBankStatus status);

    /**
     * 프로젝트 ID 목록으로 저금통 조회
     */
    List<PiggyBank> findByProjectIdIn(List<Long> projectIds);

    /**
     * 전체 저금통 잔액 합계
     */
    @Query("SELECT SUM(p.balance) FROM PiggyBank p WHERE p.status = 'ACTIVE'")
    BigDecimal sumTotalBalance();

    /**
     * 특정 기관의 프로젝트 ID 목록으로 저금통 목록 조회
     */
    @Query("SELECT p FROM PiggyBank p WHERE p.projectId IN :projectIds")
    List<PiggyBank> findByProjectIds(@Param("projectIds") List<Long> projectIds);

    /**
     * 활성 상태 저금통 개수
     */
    Long countByStatus(PiggyBank.PiggyBankStatus status);
}
