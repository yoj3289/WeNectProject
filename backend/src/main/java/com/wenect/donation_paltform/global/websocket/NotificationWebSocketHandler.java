package com.wenect.donation_paltform.global.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wenect.donation_paltform.domain.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 실시간 알림 WebSocket 핸들러
 * 사용자별 WebSocket 세션을 관리하고 알림을 실시간으로 전송
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    // 사용자 ID별 WebSocket 세션 저장소
    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = getUserId(session);
        if (userId != null) {
            // 기존 세션이 있으면 닫기 (다중 로그인 방지)
            WebSocketSession existingSession = userSessions.get(userId);
            if (existingSession != null && existingSession.isOpen()) {
                existingSession.close(CloseStatus.NORMAL);
            }

            userSessions.put(userId, session);
            log.info("WebSocket 연결 완료 - userId: {}, sessionId: {}, 현재 연결 수: {}",
                    userId, session.getId(), userSessions.size());

            // 연결 확인 메시지 전송
            sendMessage(session, Map.of(
                    "type", "CONNECTED",
                    "message", "WebSocket 연결이 완료되었습니다."
            ));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = getUserId(session);
        if (userId != null) {
            userSessions.remove(userId);
            log.info("WebSocket 연결 종료 - userId: {}, sessionId: {}, status: {}, 현재 연결 수: {}",
                    userId, session.getId(), status, userSessions.size());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 클라이언트로부터 메시지 수신 (하트비트, ping 등)
        String payload = message.getPayload();
        log.debug("WebSocket 메시지 수신 - sessionId: {}, payload: {}", session.getId(), payload);

        // ping 메시지에 대한 pong 응답
        if ("ping".equalsIgnoreCase(payload)) {
            sendMessage(session, Map.of("type", "PONG", "timestamp", System.currentTimeMillis()));
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        Long userId = getUserId(session);
        log.error("WebSocket 전송 오류 - userId: {}, sessionId: {}", userId, session.getId(), exception);

        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }

        if (userId != null) {
            userSessions.remove(userId);
        }
    }

    /**
     * 특정 사용자에게 알림 전송
     */
    public void sendNotificationToUser(Long userId, NotificationResponse notification) {
        WebSocketSession session = userSessions.get(userId);

        if (session != null && session.isOpen()) {
            try {
                Map<String, Object> message = Map.of(
                        "type", "NOTIFICATION",
                        "data", notification
                );
                sendMessage(session, message);
                log.info("실시간 알림 전송 완료 - userId: {}, notificationId: {}",
                        userId, notification.getNotificationId());
            } catch (Exception e) {
                log.error("실시간 알림 전송 실패 - userId: {}", userId, e);
            }
        } else {
            log.debug("WebSocket 세션 없음 - userId: {} (오프라인 상태)", userId);
        }
    }

    /**
     * 읽지 않은 알림 개수 업데이트 전송
     */
    public void sendUnreadCountUpdate(Long userId, long unreadCount) {
        WebSocketSession session = userSessions.get(userId);

        if (session != null && session.isOpen()) {
            try {
                Map<String, Object> message = Map.of(
                        "type", "UNREAD_COUNT_UPDATE",
                        "count", unreadCount
                );
                sendMessage(session, message);
                log.debug("읽지 않은 알림 개수 업데이트 전송 - userId: {}, count: {}", userId, unreadCount);
            } catch (Exception e) {
                log.error("읽지 않은 알림 개수 업데이트 전송 실패 - userId: {}", userId, e);
            }
        }
    }

    /**
     * 사용자가 온라인인지 확인
     */
    public boolean isUserOnline(Long userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }

    /**
     * 현재 연결된 사용자 수
     */
    public int getConnectedUserCount() {
        return userSessions.size();
    }

    /**
     * 세션에서 사용자 ID 추출
     */
    private Long getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get("userId");
        return userId != null ? (Long) userId : null;
    }

    /**
     * WebSocket 세션으로 JSON 메시지 전송
     */
    private void sendMessage(WebSocketSession session, Object data) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(data);
            session.sendMessage(new TextMessage(json));
        }
    }
}
