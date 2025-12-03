package com.wenect.donation_paltform.global.filter;

import com.wenect.donation_paltform.global.util.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * JWT 인증 필터
 * - 모든 HTTP 요청에서 JWT 토큰을 검증
 * - 유효한 토큰이면 SecurityContext에 인증 정보 설정
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. Authorization 헤더에서 JWT 토큰 추출
            String token = extractToken(request);

            if (token != null) {
                // 2. 토큰이 유효하면 인증 처리
                if (jwtTokenProvider.validateToken(token)) {
                    // 토큰에서 userId와 userType 추출
                    Long userId = jwtTokenProvider.getUserId(token);
                    String userType = jwtTokenProvider.getUserType(token);

                    // userType에 따라 권한 부여
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    if ("ADMIN".equalsIgnoreCase(userType)) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        logger.info("User " + userId + " granted ROLE_ADMIN authority");
                    } else if ("ORGANIZATION".equalsIgnoreCase(userType)) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ORGANIZATION"));
                        logger.info("User " + userId + " granted ROLE_ORGANIZATION authority");
                    } else {
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                        logger.info("User " + userId + " granted ROLE_USER authority");
                    }
                    logger.info("UserType from token: " + userType + ", Authorities: " + authorities);

                    // 인증 객체 생성
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId, // principal: userId
                                    null,   // credentials: 비밀번호는 null
                                    authorities // authorities: 권한 목록
                            );

                    // Request의 상세 정보 설정
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // SecurityContext에 인증 정보 저장
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else if (jwtTokenProvider.isTokenExpired(token)) {
                    // 3. 토큰이 만료된 경우 - 401 응답과 함께 명확한 메시지 반환
                    logger.warn("JWT token expired for request: " + request.getRequestURI());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"error\":\"JWT expired\",\"message\":\"토큰이 만료되었습니다. 다시 로그인해주세요.\"}");
                    return; // 필터 체인 중단
                }
            }
        } catch (Exception e) {
            logger.error("JWT 인증 처리 중 오류 발생", e);
        }

        // 다음 필터로 진행
        filterChain.doFilter(request, response);
    }

    /**
     * Authorization 헤더에서 Bearer 토큰 추출
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 제거
        }

        return null;
    }
}
