package com.wenect.donation_paltform.domain.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wenect.donation_paltform.domain.notification.dto.NotificationResponse;
import com.wenect.donation_paltform.domain.notification.dto.UnreadCountResponse;
import com.wenect.donation_paltform.domain.notification.entity.Notification;
import com.wenect.donation_paltform.domain.notification.repository.NotificationRepository;
import com.wenect.donation_paltform.domain.user.dto.NotificationSettingsDto;
import com.wenect.donation_paltform.domain.user.service.UserService;
import com.wenect.donation_paltform.global.websocket.NotificationWebSocketHandler;
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
    private final UserService userService;
    private final NotificationWebSocketHandler webSocketHandler;

    /**
     * 알림 설정 유형
     */
    public enum NotificationCategory {
        DONATION,    // 기부 관련
        COMMENT,     // 댓글 관련
        PROJECT,     // 프로젝트 관련
        SETTLEMENT,  // 정산 관련
        DEADLINE,    // 마감 임박
        SYSTEM       // 시스템 (항상 발송)
    }

    /**
     * 사용자의 알림 설정을 확인하여 해당 카테고리 알림이 활성화되어 있는지 확인
     */
    private boolean isNotificationEnabled(Long userId, NotificationCategory category) {
        // 시스템 알림은 항상 활성화
        if (category == NotificationCategory.SYSTEM) {
            return true;
        }

        try {
            NotificationSettingsDto settings = userService.getNotificationSettings(userId);
            if (settings == null) {
                return true; // 설정이 없으면 기본적으로 활성화
            }

            NotificationSettingsDto.NotificationChannels channels = switch (category) {
                case DONATION -> settings.getDonation();
                case COMMENT -> settings.getComment();
                case PROJECT -> settings.getProject();
                case SETTLEMENT -> settings.getSettlement();
                case DEADLINE -> settings.getDeadline();
                default -> null;
            };

            if (channels == null || channels.getEnabled() == null) {
                return true; // 설정이 없으면 기본적으로 활성화
            }

            return channels.getEnabled();
        } catch (Exception e) {
            log.warn("알림 설정 조회 실패 - userId: {}, category: {}, 기본값(true) 사용", userId, category, e);
            return true; // 오류 시 기본적으로 활성화
        }
    }

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

            // WebSocket으로 실시간 알림 전송
            sendRealTimeNotification(userId, saved);

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

        // WebSocket으로 읽지 않은 알림 개수 업데이트
        sendUnreadCountUpdate(userId);

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

        // WebSocket으로 읽지 않은 알림 개수 업데이트 (0으로)
        webSocketHandler.sendUnreadCountUpdate(userId, 0);

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
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.DONATION)) {
            log.debug("기부 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "기부가 완료되었습니다";
        String message = String.format("%s 프로젝트에 %,d원 기부가 완료되었습니다. 감사합니다!",
                projectName, amount);
        String link = "/projects/" + projectId;

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
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.PROJECT)) {
            log.debug("프로젝트 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "목표 금액 달성!";
        String message = String.format("%s 프로젝트가 목표 금액을 달성했습니다!", projectName);
        String link = "/projects/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "priority", "high"
        );

        createNotification(userId, "goal_achieved", "project", title, message, link, metadata);
    }

    // ==================== 기관 승인/거절 알림 ====================

    /**
     * 기관 승인 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createOrganizationApprovalNotification(Long userId, String orgName) {
        String title = "기관 승인 완료";
        String message = String.format("'%s' 기관이 승인되었습니다. 이제 프로젝트를 등록할 수 있습니다.", orgName);
        String link = "/organization/dashboard";

        Map<String, Object> metadata = Map.of(
                "organizationName", orgName,
                "priority", "high"
        );

        createNotification(userId, "organization_approved", "system", title, message, link, metadata);
    }

    /**
     * 기관 거절 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createOrganizationRejectionNotification(Long userId, String orgName, String reason) {
        String title = "기관 승인 반려";
        String message = String.format("'%s' 기관 승인이 반려되었습니다. 사유: %s", orgName, reason);
        String link = "/organization/profile";

        Map<String, Object> metadata = Map.of(
                "organizationName", orgName,
                "rejectionReason", reason != null ? reason : "",
                "priority", "high"
        );

        createNotification(userId, "organization_rejected", "system", title, message, link, metadata);
    }

    // ==================== 정산 관련 알림 ====================

    /**
     * 정산 요청 접수 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createSettlementRequestNotification(Long userId, String projectName, Long settlementId) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.SETTLEMENT)) {
            log.debug("정산 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "정산 요청 접수";
        String message = String.format("'%s' 프로젝트의 정산 요청이 접수되었습니다.", projectName);
        String link = "/organization/settlements";

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "settlementId", settlementId.toString(),
                "priority", "normal"
        );

        createNotification(userId, "settlement_requested", "settlement", title, message, link, metadata);
    }

    /**
     * 정산 승인 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createSettlementApprovalNotification(Long userId, String projectName, Long settlementId) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.SETTLEMENT)) {
            log.debug("정산 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "정산 승인 완료";
        String message = String.format("'%s' 프로젝트의 정산이 승인되었습니다. 저금통에서 출금을 진행해주세요.", projectName);
        String link = "/organization/projects";

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "settlementId", settlementId.toString(),
                "priority", "high"
        );

        createNotification(userId, "settlement_approved", "settlement", title, message, link, metadata);
    }

    /**
     * 정산 반려 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createSettlementRejectionNotification(Long userId, String projectName, Long settlementId, String reason) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.SETTLEMENT)) {
            log.debug("정산 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "정산 반려";
        String message = String.format("'%s' 프로젝트의 정산이 반려되었습니다. 사유: %s", projectName, reason);
        String link = "/organization/settlements";

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "settlementId", settlementId.toString(),
                "rejectionReason", reason != null ? reason : "",
                "priority", "high"
        );

        createNotification(userId, "settlement_rejected", "settlement", title, message, link, metadata);
    }

    // ==================== 지출 승인 관련 알림 ====================

    /**
     * 지출 요청 접수 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createExpenseRequestNotification(Long userId, String description, Long expenseId) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.SETTLEMENT)) {
            log.debug("정산 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "지출 요청 접수";
        String message = String.format("'%s' 지출 요청이 접수되었습니다.", description);
        String link = "/organization/expenses";

        Map<String, Object> metadata = Map.of(
                "description", description,
                "expenseId", expenseId.toString(),
                "priority", "normal"
        );

        createNotification(userId, "expense_requested", "settlement", title, message, link, metadata);
    }

    /**
     * 지출 승인 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createExpenseApprovalNotification(Long userId, String description, Long expenseId) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.SETTLEMENT)) {
            log.debug("정산 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "지출 승인 완료";
        String message = String.format("'%s' 지출이 승인되었습니다. 저금통에서 출금이 완료되었습니다.", description);
        String link = "/organization/expenses";

        Map<String, Object> metadata = Map.of(
                "description", description,
                "expenseId", expenseId.toString(),
                "priority", "normal"
        );

        createNotification(userId, "expense_approved", "settlement", title, message, link, metadata);
    }

    /**
     * 지출 반려 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createExpenseRejectionNotification(Long userId, String description, Long expenseId, String reason) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.SETTLEMENT)) {
            log.debug("정산 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "지출 반려";
        String message = String.format("'%s' 지출이 반려되었습니다. 사유: %s", description, reason);
        String link = "/organization/expenses";

        Map<String, Object> metadata = Map.of(
                "description", description,
                "expenseId", expenseId.toString(),
                "rejectionReason", reason != null ? reason : "",
                "priority", "normal"
        );

        createNotification(userId, "expense_rejected", "settlement", title, message, link, metadata);
    }

    // ==================== 기부 취소/실패 알림 ====================

    /**
     * 기부 취소 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createDonationCancelledNotification(Long userId, String projectName, Long projectId, Long amount) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.DONATION)) {
            log.debug("기부 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "기부 취소";
        String message = String.format("'%s' 프로젝트에 %,d원 기부가 취소되었습니다.", projectName, amount);
        String link = "/projects/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "amount", amount.toString(),
                "priority", "normal"
        );

        createNotification(userId, "donation_cancelled", "donation", title, message, link, metadata);
    }

    /**
     * 기부 실패 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createDonationFailedNotification(Long userId, String projectName, Long projectId, Long amount) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.DONATION)) {
            log.debug("기부 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "기부 실패";
        String message = String.format("'%s' 프로젝트에 %,d원 기부가 실패하였습니다. 다시 시도해주세요.", projectName, amount);
        String link = "/projects/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "amount", amount.toString(),
                "priority", "normal"
        );

        createNotification(userId, "donation_failed", "donation", title, message, link, metadata);
    }

    // ==================== 정산 완료 알림 ====================

    /**
     * 정산 완료 알림 생성 - 기부자에게 (헬퍼 메서드)
     */
    @Transactional
    public void createSettlementCompletedNotification(Long userId, String projectName, Long projectId) {
        // 알림 설정 확인 (기부자에게 보내는 알림이므로 DONATION 카테고리)
        if (!isNotificationEnabled(userId, NotificationCategory.DONATION)) {
            log.debug("기부 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "프로젝트 정산 완료";
        String message = String.format("후원하신 '%s' 프로젝트의 정산이 완료되었습니다. 소중한 후원 감사드립니다!", projectName);
        String link = "/projects/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "projectId", projectId.toString(),
                "priority", "normal"
        );

        createNotification(userId, "settlement_completed", "donation", title, message, link, metadata);
    }

    // ==================== 프로젝트 마감 임박 알림 ====================

    /**
     * 프로젝트 마감 임박 알림 생성 (헬퍼 메서드)
     */
    @Transactional
    public void createDeadlineSoonNotification(Long userId, String projectName, Long projectId, int daysLeft) {
        // 알림 설정 확인
        if (!isNotificationEnabled(userId, NotificationCategory.DEADLINE)) {
            log.debug("마감 임박 알림 비활성화 - userId: {}", userId);
            return;
        }

        String title = "프로젝트 마감 임박";
        String message;
        if (daysLeft == 0) {
            message = String.format("'%s' 프로젝트가 오늘 마감됩니다!", projectName);
        } else if (daysLeft == 1) {
            message = String.format("'%s' 프로젝트가 내일 마감됩니다!", projectName);
        } else {
            message = String.format("'%s' 프로젝트가 %d일 후 마감됩니다!", projectName, daysLeft);
        }
        String link = "/projects/" + projectId;

        Map<String, Object> metadata = Map.of(
                "projectName", projectName,
                "projectId", projectId.toString(),
                "daysLeft", String.valueOf(daysLeft),
                "priority", "high"
        );

        createNotification(userId, "deadline_soon", "project", title, message, link, metadata);
    }

    // ==================== WebSocket 실시간 알림 헬퍼 메서드 ====================

    /**
     * WebSocket으로 실시간 알림 전송
     */
    private void sendRealTimeNotification(Long userId, Notification notification) {
        try {
            NotificationResponse response = NotificationResponse.from(notification);
            webSocketHandler.sendNotificationToUser(userId, response);

            // 읽지 않은 알림 개수도 함께 업데이트
            sendUnreadCountUpdate(userId);

        } catch (Exception e) {
            // WebSocket 전송 실패해도 알림 저장은 성공으로 처리
            log.warn("WebSocket 실시간 알림 전송 실패 - userId: {}, notificationId: {}",
                    userId, notification.getNotificationId(), e);
        }
    }

    /**
     * WebSocket으로 읽지 않은 알림 개수 업데이트 전송
     */
    private void sendUnreadCountUpdate(Long userId) {
        try {
            long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
            webSocketHandler.sendUnreadCountUpdate(userId, unreadCount);
        } catch (Exception e) {
            log.warn("WebSocket 읽지 않은 알림 개수 업데이트 실패 - userId: {}", userId, e);
        }
    }

    /**
     * 사용자가 온라인인지 확인
     */
    public boolean isUserOnline(Long userId) {
        return webSocketHandler.isUserOnline(userId);
    }

    /**
     * 현재 온라인 사용자 수 조회
     */
    public int getOnlineUserCount() {
        return webSocketHandler.getConnectedUserCount();
    }
}
