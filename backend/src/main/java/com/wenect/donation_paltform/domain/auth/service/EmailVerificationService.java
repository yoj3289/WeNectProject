package com.wenect.donation_paltform.domain.auth.service;

import com.wenect.donation_paltform.domain.auth.entity.EmailVerification;
import com.wenect.donation_paltform.domain.auth.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository verificationRepository;
    private final JavaMailSender mailSender;

    private static final int EXPIRATION_MINUTES = 5;

    /**
     * 6자리 랜덤 숫자 생성
     */
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000 ~ 999999
        return String.valueOf(code);
    }

    /**
     * 인증번호 발송
     */
    @Transactional
    public void sendVerificationCode(String email) {
        // 1. 같은 이메일의 모든 인증 데이터 삭제 (재발송 & 재테스트용)
        verificationRepository.deleteByEmail(email);

        // 2. 인증번호 생성
        String code = generateVerificationCode();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(EXPIRATION_MINUTES);

        // 3. DB 저장
        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .verificationCode(code)
                .createdAt(now)
                .expiresAt(expiresAt)
                .isVerified(false)
                .build();
        verificationRepository.save(verification);

        // 4. 이메일 발송
        sendEmail(email, code);
    }

    /**
     * 인증번호 확인
     */
    @Transactional
    public VerificationResult verifyCode(String email, String code) {
        // 1. 가장 최근 인증 정보 조회
        EmailVerification verification = verificationRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElse(null);

        // 2. 인증 정보가 없는 경우
        if (verification == null) {
            return VerificationResult.failure("인증번호를 먼저 발송해주세요.", 0L);
        }

        // 3. 이미 인증된 경우
        if (verification.getIsVerified()) {
            return VerificationResult.success("이미 인증이 완료되었습니다.");
        }

        // 4. 만료된 경우
        if (verification.isExpired()) {
            return VerificationResult.failure("인증번호가 만료되었습니다. 새로운 인증번호를 발송해주세요.", 0L);
        }

        // 5. 인증번호 불일치
        if (!verification.getVerificationCode().equals(code)) {
            long remainingSeconds = verification.getRemainingSeconds();
            return VerificationResult.failure(
                    "인증번호가 일치하지 않습니다. " + formatRemainingTime(remainingSeconds),
                    remainingSeconds
            );
        }

        // 6. 인증 성공
        verification.verify();
        verificationRepository.save(verification);
        return VerificationResult.success("인증이 완료되었습니다.");
    }

    /**
     * 이메일이 인증되었는지 확인
     */
    @Transactional(readOnly = true)
    public boolean isEmailVerified(String email) {
        return verificationRepository.existsByEmailAndIsVerifiedTrue(email);
    }

    /**
     * 이메일 발송 (비동기)
     */
    @Async("emailTaskExecutor")
    private void sendEmail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("wenect.noreply@gmail.com");
            message.setTo(to);
            message.setSubject("[WeNect] 이메일 인증번호");
            message.setText(
                    "안녕하세요, WeNect입니다.\n\n" +
                            "회원가입을 위한 이메일 인증번호는 다음과 같습니다:\n\n" +
                            "인증번호: " + code + "\n\n" +
                            "이 인증번호는 " + EXPIRATION_MINUTES + "분 동안 유효합니다.\n\n" +
                            "본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.\n\n" +
                            "감사합니다.\n" +
                            "WeNect 드림"
            );

            mailSender.send(message);
            log.info("이메일 인증번호 발송 성공: to={}", to);
        } catch (Exception e) {
            log.error("이메일 인증번호 발송 실패: to={}, error={}", to, e.getMessage(), e);
            // 이메일 전송 실패 시에도 메인 로직은 정상 처리
        }
    }

    /**
     * 남은 시간 포맷팅
     */
    private String formatRemainingTime(long seconds) {
        if (seconds <= 0) {
            return "";
        }
        long minutes = seconds / 60;
        long secs = seconds % 60;
        return String.format("(%d분 %d초 남음)", minutes, secs);
    }

    /**
     * 인증 결과 DTO
     */
    public static class VerificationResult {
        private final boolean success;
        private final String message;
        private final Long remainingSeconds;

        private VerificationResult(boolean success, String message, Long remainingSeconds) {
            this.success = success;
            this.message = message;
            this.remainingSeconds = remainingSeconds;
        }

        public static VerificationResult success(String message) {
            return new VerificationResult(true, message, null);
        }

        public static VerificationResult failure(String message, Long remainingSeconds) {
            return new VerificationResult(false, message, remainingSeconds);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public Long getRemainingSeconds() {
            return remainingSeconds;
        }
    }
}
