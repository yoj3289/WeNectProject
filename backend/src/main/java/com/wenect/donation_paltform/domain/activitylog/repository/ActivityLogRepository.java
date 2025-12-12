package com.wenect.donation_paltform.domain.activitylog.repository;

import com.wenect.donation_paltform.domain.activitylog.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 활동 로그 Repository
 */
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /**
     * 사용자 ID로 활동 로그 조회 (최신순, 최대 50개)
     */
    List<ActivityLog> findTop50ByUser_UserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 사용자 ID와 활동 타입으로 활동 로그 조회
     */
    List<ActivityLog> findByUser_UserIdAndActivityTypeOrderByCreatedAtDesc(Long userId, ActivityLog.ActivityType activityType);
}
