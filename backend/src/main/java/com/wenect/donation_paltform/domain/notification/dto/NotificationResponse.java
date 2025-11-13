package com.wenect.donation_paltform.domain.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wenect.donation_paltform.domain.notification.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 알림 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {

    private Long notificationId;
    private String type;
    private String category;
    private String title;
    private String message;
    private String link;
    private Boolean isRead;
    private Boolean isArchived;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private Map<String, Object> metadata;

    /**
     * Entity를 DTO로 변환
     */
    public static NotificationResponse from(Notification notification) {
        Map<String, Object> metadataMap = null;

        // JSON 문자열을 Map으로 변환
        if (notification.getMetadata() != null && !notification.getMetadata().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                metadataMap = objectMapper.readValue(
                    notification.getMetadata(),
                    new TypeReference<Map<String, Object>>() {}
                );
            } catch (JsonProcessingException e) {
                log.error("Failed to parse notification metadata: {}", notification.getMetadata(), e);
            }
        }

        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .type(notification.getType())
                .category(notification.getCategory())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.getIsRead())
                .isArchived(notification.getIsArchived())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .metadata(metadataMap)
                .build();
    }
}
