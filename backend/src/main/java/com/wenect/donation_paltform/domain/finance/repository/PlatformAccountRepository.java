package com.wenect.donation_paltform.domain.finance.repository;

import com.wenect.donation_paltform.domain.finance.entity.PlatformAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformAccountRepository extends JpaRepository<PlatformAccount, Long> {

    /**
     * 활성화된 모든 계좌 조회
     */
    List<PlatformAccount> findByIsActiveTrue();

    /**
     * 주 계좌 조회
     */
    Optional<PlatformAccount> findByIsPrimaryTrueAndIsActiveTrue();

    /**
     * 활성화된 주 계좌 조회 (없으면 첫 번째 활성 계좌)
     */
    @Query("SELECT pa FROM PlatformAccount pa WHERE pa.isActive = true ORDER BY pa.isPrimary DESC, pa.createdAt ASC")
    List<PlatformAccount> findActiveAccountsOrderByPrimary();

    /**
     * 계좌 존재 여부 확인
     */
    boolean existsByAccountNumberAndIsActiveTrue(String accountNumber);
}
