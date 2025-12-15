package com.wenect.donation_paltform.global.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * 암호화 설정 관리
 * JPA Converter보다 먼저 초기화되어 암호화 키를 제공
 */
@Configuration
@Slf4j
public class EncryptionConfig {

    @Getter
    private static String accountSecretKey;

    @Value("${encryption.account.secret-key:}")
    private String secretKey;

    @PostConstruct
    public void init() {
        if (secretKey == null || secretKey.isEmpty()) {
            log.warn("암호화 키가 설정되지 않았습니다. 기본 키를 사용합니다.");
            accountSecretKey = "WeNectDonation2024SecureKey!@#$%^"; // 정확히 32바이트
        } else {
            accountSecretKey = secretKey;
            log.info("암호화 키가 정상적으로 로드되었습니다.");
        }
    }
}
