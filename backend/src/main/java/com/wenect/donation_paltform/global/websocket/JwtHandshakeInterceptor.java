package com.wenect.donation_paltform.global.websocket;

import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket 연결 시 JWT 토큰 검증 인터셉터
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        try {
            String token = extractToken(request);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserId(token);
                String userType = jwtTokenProvider.getUserType(token);

                attributes.put("userId", userId);
                attributes.put("userType", userType);

                log.info("WebSocket 연결 인증 성공 - userId: {}", userId);
                return true;
            }

            log.warn("WebSocket 연결 인증 실패 - 유효하지 않은 토큰");
            return false;

        } catch (Exception e) {
            log.error("WebSocket 핸드셰이크 중 오류 발생", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // 핸드셰이크 후 처리 (필요 시 구현)
    }

    /**
     * 요청에서 JWT 토큰 추출
     * - 쿼리 파라미터: ?token=xxx
     * - 헤더: Authorization: Bearer xxx
     */
    private String extractToken(ServerHttpRequest request) {
        // 1. 쿼리 파라미터에서 추출 (WebSocket은 헤더 전송이 제한적)
        String query = request.getURI().getQuery();
        if (query != null && query.contains("token=")) {
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("token=")) {
                    return param.substring(6);
                }
            }
        }

        // 2. Authorization 헤더에서 추출
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            String authHeader = servletRequest.getServletRequest().getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        }

        return null;
    }
}
