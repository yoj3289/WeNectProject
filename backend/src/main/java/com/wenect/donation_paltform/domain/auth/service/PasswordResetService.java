package com.wenect.donation_paltform.domain.auth.service;

import com.wenect.donation_paltform.domain.auth.dto.PasswordResetRequest;
import com.wenect.donation_paltform.domain.auth.entity.EmailVerification;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.EmailVerificationRepository;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

/**
 * 비밀번호 재설정 서비스
 * - 기존 EmailVerificationService 구조를 활용
 * - 비밀번호 찾기 전용 인증번호 발송 및 검증
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    private static final int EXPIRATION_MINUTES = 5;

    /**
     * 이메일이 가입된 이메일인지 확인
     */
    @Transactional(readOnly = true)
    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * 비밀번호 재설정용 인증번호 발송
     */
    @Transactional
    public void sendPasswordResetCode(String email) {
        // 1. 가입된 이메일인지 확인
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }

        // 2. 탈퇴한 사용자인지 확인
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (user.getStatus() == User.UserStatus.DELETED) {
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
        }

        // 3. 같은 이메일의 기존 인증 데이터 삭제
        verificationRepository.deleteByEmail(email);

        // 4. 인증번호 생성
        String code = generateVerificationCode();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(EXPIRATION_MINUTES);

        // 5. DB 저장
        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .verificationCode(code)
                .createdAt(now)
                .expiresAt(expiresAt)
                .isVerified(false)
                .build();
        verificationRepository.save(verification);

        // 6. 이메일 발송
        sendPasswordResetEmail(email, code);

        log.info("비밀번호 재설정 인증번호 발송 - email: {}", email);
    }

    /**
     * 인증번호 확인 (비밀번호 재설정 전 검증용)
     */
    @Transactional
    public VerificationResult verifyPasswordResetCode(String email, String code) {
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
            return VerificationResult.success("인증이 완료되었습니다.");
        }

        // 4. 만료된 경우
        if (verification.isExpired()) {
            return VerificationResult.failure("인증번호가 만료되었습니다. 새로운 인증번호를 발송해주세요.", 0L);
        }

        // 5. 인증번호 불일치
        if (!verification.getVerificationCode().equals(code)) {
            long remainingSeconds = verification.getRemainingSeconds();
            return VerificationResult.failure(
                    "인증번호가 일치하지 않습니다.",
                    remainingSeconds
            );
        }

        // 6. 인증 성공 - 인증 완료 표시
        verification.verify();
        verificationRepository.save(verification);
        return VerificationResult.success("인증이 완료되었습니다.");
    }

    /**
     * 비밀번호 재설정
     */
    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        String email = request.getEmail();
        String code = request.getCode();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        // 1. 새 비밀번호와 확인 비밀번호 일치 확인
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        }

        // 2. 인증 정보 확인
        EmailVerification verification = verificationRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("인증번호를 먼저 발송해주세요."));

        // 3. 인증 완료 여부 확인
        if (!verification.getIsVerified()) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        // 4. 인증번호 재확인 (보안 강화)
        if (!verification.getVerificationCode().equals(code)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        // 5. 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 6. 비밀번호 변경
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 7. 사용된 인증 정보 삭제
        verificationRepository.deleteByEmail(email);

        log.info("비밀번호 재설정 완료 - email: {}", email);
    }

    /**
     * 6자리 랜덤 숫자 생성
     */
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    /**
     * 비밀번호 재설정 이메일 발송 (비동기)
     */
    @Async("emailTaskExecutor")
    protected void sendPasswordResetEmail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("wenect.noreply@gmail.com");
            message.setTo(to);
            message.setSubject("[WeNect] 비밀번호 재설정 인증번호");
            message.setText(
                    "안녕하세요, WeNect입니다.\n\n" +
                            "비밀번호 재설정을 위한 인증번호는 다음과 같습니다:\n\n" +
                            "인증번호: " + code + "\n\n" +
                            "이 인증번호는 " + EXPIRATION_MINUTES + "분 동안 유효합니다.\n\n" +
                            "본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.\n" +
                            "계정 보안을 위해 비밀번호를 주기적으로 변경해주세요.\n\n" +
                            "감사합니다.\n" +
                            "WeNect 드림"
            );

            mailSender.send(message);
            log.info("비밀번호 재설정 이메일 발송 성공: to={}", to);
        } catch (Exception e) {
            log.error("비밀번호 재설정 이메일 발송 실패: to={}, error={}", to, e.getMessage(), e);
        }
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
