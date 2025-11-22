package com.wenect.donation_paltform.domain.user.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.user.dto.ChangePasswordRequest;
import com.wenect.donation_paltform.domain.user.dto.DeleteAccountRequestDto;
import com.wenect.donation_paltform.domain.user.dto.NotificationSettingsDto;
import com.wenect.donation_paltform.domain.user.dto.UpdateProfileRequest;
import com.wenect.donation_paltform.domain.user.dto.UserProfileResponse;
import com.wenect.donation_paltform.domain.user.entity.UserDeletionLog;
import com.wenect.donation_paltform.domain.user.repository.UserDeletionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final UserDeletionLogRepository userDeletionLogRepository;

    /**
     * 사용자 프로필 조회
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        return UserProfileResponse.from(user);
    }

    /**
     * 사용자 프로필 수정
     */
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 이메일 변경 시 중복 체크 (현재 사용자 제외)
        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
            }
        }

        // 전화번호 변경 시 중복 체크 (현재 사용자 제외, null 허용)
        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new IllegalArgumentException("이미 사용 중인 전화번호입니다");
            }
        }

        // 프로필 정보 업데이트
        user.setEmail(request.getEmail());
        user.setUserName(request.getUserName());
        user.setPhone(request.getPhone());

        User updatedUser = userRepository.save(user);
        return UserProfileResponse.from(updatedUser);
    }

    /**
     * 비밀번호 변경
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 새 비밀번호와 확인 비밀번호 일치 확인
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("새 비밀번호와 확인 비밀번호가 일치하지 않습니다");
        }

        // 현재 비밀번호 검증
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다");
        }

        // 새 비밀번호가 현재 비밀번호와 동일한지 확인
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다");
        }

        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * 알림 설정 조회
     */
    @Transactional(readOnly = true)
    public NotificationSettingsDto getNotificationSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 알림 설정이 없으면 기본값 반환
        if (user.getNotificationSettings() == null || user.getNotificationSettings().isEmpty()) {
            return NotificationSettingsDto.builder().build();
        }

        try {
            return objectMapper.readValue(user.getNotificationSettings(), NotificationSettingsDto.class);
        } catch (JsonProcessingException e) {
            log.error("알림 설정 파싱 실패 - userId: {}", userId, e);
            return NotificationSettingsDto.builder().build();
        }
    }

    /**
     * 알림 설정 업데이트
     */
    @Transactional
    public NotificationSettingsDto updateNotificationSettings(Long userId, NotificationSettingsDto settings) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        try {
            String settingsJson = objectMapper.writeValueAsString(settings);
            user.setNotificationSettings(settingsJson);
            userRepository.save(user);

            log.info("알림 설정 업데이트 완료 - userId: {}", userId);
            return settings;
        } catch (JsonProcessingException e) {
            log.error("알림 설정 저장 실패 - userId: {}", userId, e);
            throw new RuntimeException("알림 설정 저장 중 오류가 발생했습니다", e);
        }
    }

    /**
     * 회원 탈퇴
     * - 비밀번호 확인 필수
     * - 30일간 유예 기간 (소프트 삭제)
     * - 탈퇴 로그 기록 (법적 증거용)
     *
     * @param userId 사용자 ID
     * @param request 탈퇴 요청 (비밀번호, 사유)
     * @param ipAddress 요청 IP 주소
     * @param userAgent User Agent (브라우저 정보)
     */
    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequestDto request, String ipAddress, String userAgent) {
        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 이미 탈퇴한 사용자인지 확인
        if (user.getStatus() == User.UserStatus.DELETED) {
            throw new IllegalStateException("이미 탈퇴 처리된 계정입니다");
        }

        // 비밀번호 확인 (본인 확인)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다");
        }

        // 탈퇴 처리
        LocalDateTime now = LocalDateTime.now();
        user.setStatus(User.UserStatus.DELETED);
        user.setDeletedAt(now);
        user.setDeleteReason(request.getReason());
        userRepository.save(user);

        // 탈퇴 로그 기록 (법적 증거용)
        UserDeletionLog deletionLog = UserDeletionLog.builder()
                .userId(userId)
                .email(user.getEmail())
                .userName(user.getUserName())
                .deleteReason(request.getReason())
                .deletedAt(now)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .scheduledDeletionDate(now.plusDays(30)) // 30일 후
                .isPermanentlyDeleted(false)
                .build();
        userDeletionLogRepository.save(deletionLog);

        log.info("회원 탈퇴 처리 완료 - userId: {}, email: {}, ip: {}",
                userId, user.getEmail(), ipAddress);
    }
}
