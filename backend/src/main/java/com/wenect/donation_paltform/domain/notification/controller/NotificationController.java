package com.wenect.donation_paltform.domain.notification.controller;

import com.wenect.donation_paltform.domain.notification.dto.NotificationResponse;
import com.wenect.donation_paltform.domain.notification.dto.UnreadCountResponse;
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 알림 관련 컨트롤러
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 내 알림 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("알림 목록 조회 요청 - userId: {}", userId);

        List<NotificationResponse> notifications = notificationService.getMyNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * 읽지 않은 알림 개수 조회
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("읽지 않은 알림 개수 조회 요청 - userId: {}", userId);

        UnreadCountResponse response = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 알림 읽음 처리
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<String> markAsRead(
            @PathVariable("id") Long notificationId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("알림 읽음 처리 요청 - notificationId: {}, userId: {}", notificationId, userId);

        try {
            notificationService.markAsRead(notificationId, userId);
            return ResponseEntity.ok("알림을 읽음으로 표시했습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 모든 알림 읽음 처리
     */
    @PutMapping("/read-all")
    public ResponseEntity<String> markAllAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("모든 알림 읽음 처리 요청 - userId: {}", userId);

        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok("모든 알림을 읽음으로 표시했습니다.");
    }

    /**
     * 알림 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNotification(
            @PathVariable("id") Long notificationId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long userId = getUserIdFromToken(authHeader);
        log.info("알림 삭제 요청 - notificationId: {}, userId: {}", notificationId, userId);

        try {
            notificationService.deleteNotification(notificationId, userId);
            return ResponseEntity.ok("알림이 삭제되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * JWT 토큰에서 userId 추출
     */
    private Long getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }

        String token = authHeader.substring(7); // "Bearer " 제거
        return jwtTokenProvider.getUserId(token);
    }
}
