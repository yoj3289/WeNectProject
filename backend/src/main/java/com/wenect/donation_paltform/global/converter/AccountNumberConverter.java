package com.wenect.donation_paltform.global.converter;

import com.wenect.donation_paltform.global.config.EncryptionConfig;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 계좌번호 암호화/복호화 컨버터
 * AES-256-GCM 암호화를 사용하여 DB 저장 시 암호화, 조회 시 복호화
 */
@Converter(autoApply = false)
@Slf4j
public class AccountNumberConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final String DEFAULT_KEY = "WeNectDonation2024SecureKey12345"; // 정확히 32바이트

    private String getSecretKey() {
        String key = EncryptionConfig.getAccountSecretKey();
        return (key != null && !key.isEmpty()) ? key : DEFAULT_KEY;
    }

    @Override
    public String convertToDatabaseColumn(String accountNumber) {
        if (accountNumber == null || accountNumber.isEmpty()) {
            return accountNumber;
        }

        try {
            // 이미 암호화된 값인지 확인 (Base64 + IV 구조)
            if (isAlreadyEncrypted(accountNumber)) {
                return accountNumber;
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            SecretKeySpec keySpec = new SecretKeySpec(
                    getSecretKey().getBytes(StandardCharsets.UTF_8), "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            byte[] encrypted = cipher.doFinal(accountNumber.getBytes(StandardCharsets.UTF_8));

            // IV + 암호문을 합쳐서 Base64 인코딩
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            log.error("계좌번호 암호화 실패", e);
            throw new RuntimeException("계좌번호 암호화 중 오류가 발생했습니다", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String encryptedAccountNumber) {
        if (encryptedAccountNumber == null || encryptedAccountNumber.isEmpty()) {
            return encryptedAccountNumber;
        }

        try {
            // 암호화되지 않은 평문인 경우 그대로 반환 (마이그레이션 대응)
            if (!isAlreadyEncrypted(encryptedAccountNumber)) {
                log.debug("평문 계좌번호 감지 - 복호화 스킵");
                return encryptedAccountNumber;
            }

            byte[] combined = Base64.getDecoder().decode(encryptedAccountNumber);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);

            SecretKeySpec keySpec = new SecretKeySpec(
                    getSecretKey().getBytes(StandardCharsets.UTF_8), "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("계좌번호 복호화 실패", e);
            // 복호화 실패 시 원본 반환 (마이그레이션 대응)
            return encryptedAccountNumber;
        }
    }

    /**
     * 이미 암호화된 값인지 확인
     * Base64 인코딩된 값이고 최소 길이를 만족하면 암호화된 것으로 판단
     */
    private boolean isAlreadyEncrypted(String value) {
        if (value == null || value.length() < 20) {
            return false;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(value);
            // IV(12바이트) + 최소 암호문(1바이트) + 태그(16바이트) = 최소 29바이트
            return decoded.length >= 29;
        } catch (IllegalArgumentException e) {
            // Base64 디코딩 실패 = 평문
            return false;
        }
    }

    /**
     * 계좌번호 마스킹 처리 (외부 노출용)
     * 예: 1234567890123 → ****-****-0123
     */
    public static String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isEmpty()) {
            return accountNumber;
        }

        // 숫자만 추출
        String digits = accountNumber.replaceAll("[^0-9]", "");

        if (digits.length() <= 4) {
            return "****";
        }

        // 마지막 4자리만 표시
        String lastFour = digits.substring(digits.length() - 4);
        int maskedLength = digits.length() - 4;

        // 마스킹 형태로 변환
        StringBuilder masked = new StringBuilder();
        for (int i = 0; i < maskedLength; i++) {
            if (i > 0 && i % 4 == 0) {
                masked.append("-");
            }
            masked.append("*");
        }
        masked.append("-").append(lastFour);

        return masked.toString();
    }
}
