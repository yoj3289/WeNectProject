package com.wenect.donation_paltform.domain.activitylog.service;

import com.wenect.donation_paltform.domain.activitylog.dto.ActivityLogResponse;
import com.wenect.donation_paltform.domain.activitylog.entity.ActivityLog;
import com.wenect.donation_paltform.domain.activitylog.repository.ActivityLogRepository;
import com.wenect.donation_paltform.domain.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 활동 로그 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    /**
     * 사용자별 활동 로그 조회 (최신 50개)
     */
    public List<ActivityLogResponse> getUserActivityLogs(Long userId) {
        List<ActivityLog> logs = activityLogRepository.findTop50ByUser_UserIdOrderByCreatedAtDesc(userId);

        return logs.stream()
                .map(ActivityLogResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 활동 로그 저장
     */
    @Transactional
    public void saveActivityLog(ActivityLog activityLog) {
        activityLogRepository.save(activityLog);
    }

    /**
     * 로그인 로그 저장
     */
    @Transactional
    public void logLogin(User user, String ipAddress) {
        ActivityLog log = ActivityLog.createLoginLog(user, ipAddress);
        activityLogRepository.save(log);
    }

    /**
     * 기부 완료 로그 저장
     */
    @Transactional
    public void logDonation(User user, String projectTitle, Long amount, String ipAddress) {
        ActivityLog log = ActivityLog.createDonationLog(user, projectTitle, amount, ipAddress);
        activityLogRepository.save(log);
    }

    /**
     * 프로필 수정 로그 저장
     */
    @Transactional
    public void logProfileUpdate(User user, String updateType, String ipAddress) {
        ActivityLog log = ActivityLog.createProfileUpdateLog(user, updateType, ipAddress);
        activityLogRepository.save(log);
    }
}
