package com.wenect.donation_paltform.domain.expense.repository;

import com.wenect.donation_paltform.domain.expense.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /**
     * 프로젝트 ID로 지출 내역 목록 조회 (지출일 기준 내림차순)
     */
    List<Expense> findByProjectIdOrderByExpenseDateDesc(Long projectId);

    /**
     * 프로젝트 ID와 상태로 지출 내역 목록 조회
     */
    List<Expense> findByProjectIdAndStatus(Long projectId, Expense.ExpenseStatus status);

    /**
     * 상태별로 지출 내역 목록 조회
     */
    List<Expense> findByStatusOrderByCreatedAtDesc(Expense.ExpenseStatus status);

    /**
     * 프로젝트 ID와 상태로 지출 건수 조회
     */
    Long countByProjectIdAndStatus(Long projectId, Expense.ExpenseStatus status);

    /**
     * 프로젝트 ID로 승인된 지출 총액 계산
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.projectId = :projectId AND e.status = 'APPROVED'")
    BigDecimal sumApprovedAmountByProjectId(@Param("projectId") Long projectId);
}
