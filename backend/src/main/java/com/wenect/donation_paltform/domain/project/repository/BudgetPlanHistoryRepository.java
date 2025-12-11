package com.wenect.donation_paltform.domain.project.repository;

import com.wenect.donation_paltform.domain.project.entity.BudgetPlanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 기부금 사용계획 변경 이력 Repository
 */
@Repository
public interface BudgetPlanHistoryRepository extends JpaRepository<BudgetPlanHistory, Long> {

    /**
     * 프로젝트별 변경 이력 조회 (최신순)
     */
    List<BudgetPlanHistory> findByProjectIdOrderByChangedAtDesc(Long projectId);

    /**
     * 프로젝트별 변경 이력 수 조회
     */
    int countByProjectId(Long projectId);
}
