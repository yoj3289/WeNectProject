package com.wenect.donation_paltform.global.config;

import com.wenect.donation_paltform.global.websocket.JwtHandshakeInterceptor;
import com.wenect.donation_paltform.global.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket 설정
 * 실시간 알림을 위한 WebSocket 연결 설정
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .addInterceptors(jwtHandshakeInterceptor)
                .setAllowedOrigins("*");  // 프로덕션에서는 특정 도메인으로 제한 필요
    }
}
