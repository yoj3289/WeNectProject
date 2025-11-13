package com.wenect.donation_paltform.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wenect.donation_paltform.domain.notification.dto.NotificationResponse;
import com.wenect.donation_paltform.domain.notification.dto.UnreadCountResponse;
import com.wenect.donation_paltform.domain.notification.entity.Notification;
import com.wenect.donation_paltform.domain.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    /**
     * 알림 생성
     */
    @Transactional
    public Notification createNotification(Long userId, String type, String category,
                                           String title, String message, String link,
                                           Map<String, Object> metadata) {
        try {
            // 메타데이터를 JSON 문자열로 변환
            String metadataJson = null;
            if (metadata != null && !metadata.isEmpty()) {
                metadataJson = objectMapper.writeValueAsString(metadata);
            }

            Notification notification = Notification.builder()
                    .userId(userId)
                    .type(type)
                    .category(category)
                    .title(title)
                    .message(message)
                    .link(link)
                    .metadata(metadataJson)
                    .build();

            Notification saved = notificationRepository.save(notification);
            log.info("알림 생성 완료 - userId: {}, type: {}, notificationId: {}",
                    userId, type, saved.getNotificationId());

            return saved;

        } catch (JsonProcessingException e) {
            log.error("알림 메타데이터 변환 실패", e);
            throw new RuntimeException("알림 생성 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 사용자별 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(Long userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return UnreadCountResponse.builder()
                .count(count)
                .build();
    }

    /**
     * 알림 읽음 처리
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        // 권한 확인: 해당 알림의 소유자인지 확인
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("알림에 대한 권한이 없습니다.");
        }

        notification.markAsRead();
        notificationRepository.save(notification);

        log.info("알림 읽음 처리 - notificationId: {}, userId: {}", notificationId, userId);
    }

    /**
     * 모든 알림 읽음 처리
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
        }

        notificationRepository.saveAll(unreadNotifications);

        log.info("모든 알림 읽음 처리 - userId: {}, count: {}", userId, unreadNotifications.size());
    }

    /**
     * 알림 삭제
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        // 권한 확인: 해당 알림의 소유자인지 확인
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("알림에 대한 권한이 없습니다.");
        }

        notificationRepository.delete(notification);

        log.info("알림 삭제 완료 - notificationId: {}, userId: {}", notificationId, userId);
    }

    /**
     * 기부 완료 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createDonationNotification(Long userId, String projectName, Long projectId, Long amount) {
        String title = "기부가 완료되었습니다";
        String message = String.format("%s 프로젝트에 %,d원 기부가 완료되었습니다. 감사합니다!",
                projectName, amount);
        String link = "/project/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "amount", String.valueOf(amount),
                "priority", "normal"
        );

        createNotification(userId, "donation", "donation", title, message, link, metadata);
    }

    /**
     * 프로젝트 목표 달성 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createGoalAchievedNotification(Long userId, String projectName, Long projectId) {
        String title = "목표 금액 달성!";
        String message = String.format("%s 프로젝트가 목표 금액을 달성했습니다!", projectName);
        String link = "/project/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "priority", "high"
        );

        createNotification(userId, "goal_achieved", "project", title, message, link, metadata);
    }
}
