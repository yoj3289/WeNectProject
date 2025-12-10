package com.wenect.donation_paltform.domain.notification.scheduler;

import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.favorite.repository.FavoriteProjectRepository;
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 프로젝트 마감 임박 알림 스케줄러
 * - 매일 오전 9시에 실행
 * - 마감 3일 전, 1일 전, 당일에 알림 발송
 * - 대상: 관심 등록자 + 기부자
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DeadlineNotificationScheduler {

    private final ProjectRepository projectRepository;
    private final FavoriteProjectRepository favoriteProjectRepository;
    private final DonationRepository donationRepository;
    private final NotificationService notificationService;

    /**
     * 마감 임박 프로젝트 알림 발송
     * - 실행 시간: 매일 09:00 (오전 9시)
     * - 대상: 마감 3일 전, 1일 전, 당일 프로젝트
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendDeadlineNotifications() {
        log.info("=== 마감 임박 알림 스케줄러 시작 ===");

        LocalDate today = LocalDate.now();

        // 마감 당일 (D-day)
        sendNotificationsForDate(today, 0);

        // 마감 1일 전 (D-1)
        sendNotificationsForDate(today.plusDays(1), 1);

        // 마감 3일 전 (D-3)
        sendNotificationsForDate(today.plusDays(3), 3);

        log.info("=== 마감 임박 알림 스케줄러 완료 ===");
    }

    /**
     * 특정 마감일에 해당하는 프로젝트의 알림 발송
     */
    private void sendNotificationsForDate(LocalDate endDate, int daysLeft) {
        List<Project> projects = projectRepository.findByStatusAndEndDate(Project.ProjectStatus.ACTIVE, endDate);

        if (projects.isEmpty()) {
            log.info("마감 {}일 전 프로젝트 없음 (endDate: {})", daysLeft, endDate);
            return;
        }

        log.info("마감 {}일 전 프로젝트: {}개 (endDate: {})", daysLeft, projects.size(), endDate);

        for (Project project : projects) {
            sendNotificationsForProject(project, daysLeft);
        }
    }

    /**
     * 특정 프로젝트의 관심 등록자와 기부자에게 알림 발송
     */
    private void sendNotificationsForProject(Project project, int daysLeft) {
        Long projectId = project.getProjectId();
        String projectName = project.getTitle();

        // 중복 알림 방지를 위한 Set
        Set<Long> notifiedUserIds = new HashSet<>();

        // 1. 관심 등록자에게 알림 발송
        List<Long> favoriteUserIds = favoriteProjectRepository.findUserIdsByProjectId(projectId);
        for (Long userId : favoriteUserIds) {
            if (notifiedUserIds.add(userId)) {
                sendNotification(userId, projectName, projectId, daysLeft);
            }
        }

        // 2. 기부자에게 알림 발송 (중복 제외)
        List<Long> donorUserIds = donationRepository.findDistinctUserIdsByProjectId(projectId);
        for (Long userId : donorUserIds) {
            if (notifiedUserIds.add(userId)) {
                sendNotification(userId, projectName, projectId, daysLeft);
            }
        }

        log.info("프로젝트 마감 임박 알림 발송 - projectId: {}, daysLeft: {}, 발송 대상: {}명",
                projectId, daysLeft, notifiedUserIds.size());
    }

    /**
     * 개별 알림 발송
     */
    private void sendNotification(Long userId, String projectName, Long projectId, int daysLeft) {
        try {
            notificationService.createDeadlineSoonNotification(userId, projectName, projectId, daysLeft);
        } catch (Exception e) {
            log.error("마감 임박 알림 생성 실패 - userId: {}, projectId: {}", userId, projectId, e);
        }
    }
}
