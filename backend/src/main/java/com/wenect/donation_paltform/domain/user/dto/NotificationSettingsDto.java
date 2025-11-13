package com.wenect.donation_paltform.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알림 설정 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationChannels {
        @Builder.Default
        private Boolean enabled = true;
        @Builder.Default
        private Boolean email = false;
        @Builder.Default
        private Boolean sms = false;
        @Builder.Default
        private Boolean push = false;
    }

    @Builder.Default
    private NotificationChannels donation = NotificationChannels.builder().build();

    @Builder.Default
    private NotificationChannels comment = NotificationChannels.builder().build();

    @Builder.Default
    private NotificationChannels project = NotificationChannels.builder().build();

    @Builder.Default
    private NotificationChannels settlement = NotificationChannels.builder().build();

    @Builder.Default
    private NotificationChannels deadline = NotificationChannels.builder().build();
}
