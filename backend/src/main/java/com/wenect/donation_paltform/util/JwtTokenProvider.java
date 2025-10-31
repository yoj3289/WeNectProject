package com.wenect.donation_paltform.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {
    
    private final SecretKey secretKey;
    private final long validityInMilliseconds = 3600000; // 1시간
    
    public JwtTokenProvider(@Value("${jwt.secret:mySecretKeyForJwtTokenGenerationAndValidation123456789}") String secret) {
        // SecretKey 생성 (최소 256비트 필요)
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    /**
     * JWT 토큰 생성
     */
    public String createToken(Long userId, String email, String userType) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("userType", userType);
        
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);
        
        return Jwts.builder()
                .subject(email)
                .claims(claims)
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey)
                .compact();
    }
    
    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    public Long getUserId(String token) {
        return getClaims(token).get("userId", Long.class);
    }
    
    /**
     * JWT 토큰에서 이메일 추출
     */
    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }
    
    /**
     * JWT 토큰에서 사용자 타입 추출
     */
    public String getUserType(String token) {
        return getClaims(token).get("userType", String.class);
    }
    
    /**
     * JWT 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * JWT 토큰에서 Claims 추출
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}