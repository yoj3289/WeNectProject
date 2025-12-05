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
}
