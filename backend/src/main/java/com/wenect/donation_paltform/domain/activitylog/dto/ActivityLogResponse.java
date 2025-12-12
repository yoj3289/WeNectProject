package com.wenect.donation_paltform.domain.activitylog.dto;

import com.wenect.donation_paltform.domain.activitylog.entity.ActivityLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 활동 로그 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {

    private Long logId;
    private String activityType;
    private String action;         // 한글 액션명
    private String details;
    private String ipAddress;
    private String timestamp;      // 포맷된 시간

    /**
     * Entity -> DTO 변환
     */
    public static ActivityLogResponse from(ActivityLog log) {
        return ActivityLogResponse.builder()
                .logId(log.getLogId())
                .activityType(log.getActivityType().name())
                .action(getActionLabel(log.getActivityType()))
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(formatDateTime(log.getCreatedAt()))
                .build();
    }

    /**
     * 활동 타입을 한글로 변환
     */
    private static String getActionLabel(ActivityLog.ActivityType activityType) {
        return switch (activityType) {
            case LOGIN -> "로그인";
            case DONATION -> "기부 완료";
            case PROFILE_UPDATE -> "프로필 수정";
        };
    }

    /**
     * LocalDateTime을 "yyyy-MM-dd HH:mm" 형식으로 변환
     */
    private static String formatDateTime(LocalDateTime dateTime) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        return dateTime.format(formatter);
    }
}
