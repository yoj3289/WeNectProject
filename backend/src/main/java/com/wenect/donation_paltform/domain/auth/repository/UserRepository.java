package com.wenect.donation_paltform.domain.auth.repository;

import com.wenect.donation_paltform.domain.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    // 사용자 타입별 조회 (ADMIN 등)
    List<User> findByUserType(User.UserType userType);

    // ==================== 성능 최적화: 집계 쿼리 ====================

    /**
     * 기간 내 가입한 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    Long countByCreatedAtBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 기간 내 타입별 가입한 사용자 수 조회
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = :userType AND u.createdAt BETWEEN :start AND :end")
    Long countByUserTypeAndCreatedAtBetween(
            @Param("userType") User.UserType userType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 주간/월간 사용자 가입 통계 (타입별 집계)
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', u.createdAt, '%Y-%m-%d') as dateStr, " +
            "u.userType as userType, COUNT(u) as cnt " +
            "FROM User u " +
            "WHERE u.createdAt BETWEEN :start AND :end " +
            "GROUP BY FUNCTION('DATE_FORMAT', u.createdAt, '%Y-%m-%d'), u.userType " +
            "ORDER BY dateStr")
    List<Object[]> findUserStatsByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 월별 사용자 가입 통계 (타입별 집계)
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', u.createdAt, '%Y-%m') as monthStr, " +
            "u.userType as userType, COUNT(u) as cnt " +
            "FROM User u " +
            "WHERE u.createdAt BETWEEN :start AND :end " +
            "GROUP BY FUNCTION('DATE_FORMAT', u.createdAt, '%Y-%m'), u.userType " +
            "ORDER BY monthStr")
    List<Object[]> findMonthlyUserStats(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}