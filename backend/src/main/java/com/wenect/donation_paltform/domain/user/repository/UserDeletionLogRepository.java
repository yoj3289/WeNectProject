package com.wenect.donation_paltform.domain.user.repository;

import com.wenect.donation_paltform.domain.user.entity.UserDeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeletionLogRepository extends JpaRepository<UserDeletionLog, Long> {

    /**
     * 사용자 ID로 탈퇴 로그 조회
     */
    Optional<UserDeletionLog> findByUserId(Long userId);

    /**
     * 완전 삭제 예정일이 지난 로그 조회 (스케줄러용)
     */
    @Query("SELECT log FROM UserDeletionLog log " +
           "WHERE log.scheduledDeletionDate <= :now " +
           "AND log.isPermanentlyDeleted = false")
    List<UserDeletionLog> findDeletionLogsToProcess(@Param("now") LocalDateTime now);
}
