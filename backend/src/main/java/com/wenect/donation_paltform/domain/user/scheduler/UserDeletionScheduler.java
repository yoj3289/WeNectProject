package com.wenect.donation_paltform.domain.user.scheduler;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.user.entity.UserDeletionLog;
import com.wenect.donation_paltform.domain.user.repository.UserDeletionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 회원 탈퇴 30일 후 영구 삭제 스케줄러
 * - 매일 오전 2시에 실행
 * - 30일 유예 기간이 지난 탈퇴 회원을 영구 삭제
 * - 법적 증거 보관을 위해 UserDeletionLog는 유지
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class UserDeletionScheduler {

    private final UserRepository userRepository;
    private final UserDeletionLogRepository userDeletionLogRepository;

    /**
     * 30일 유예 기간이 지난 탈퇴 회원 영구 삭제
     * - 실행 시간: 매일 02:00 (오전 2시)
     * - 대상: scheduledDeletionDate <= 현재 시각이고 아직 영구 삭제되지 않은 로그
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void permanentlyDeleteUsers() {
        log.info("=== 회원 영구 삭제 스케줄러 시작 ===");

        LocalDateTime now = LocalDateTime.now();
        List<UserDeletionLog> logsToProcess = userDeletionLogRepository.findDeletionLogsToProcess(now);

        log.info("영구 삭제 대상: {}건", logsToProcess.size());

        int deletedCount = 0;

        for (UserDeletionLog deletionLog : logsToProcess) {
            try {
                // 1. 사용자 데이터 영구 삭제
                userRepository.findById(deletionLog.getUserId()).ifPresent(user -> {
                    userRepository.delete(user);
                    log.info("사용자 데이터 영구 삭제 완료 - userId: {}, email: {}, 탈퇴일: {}, 예정일: {}",
                            deletionLog.getUserId(),
                            deletionLog.getEmail(),
                            deletionLog.getDeletedAt(),
                            deletionLog.getScheduledDeletionDate());
                });

                // 2. 삭제 로그에 영구 삭제 완료 표시 (법적 증거 보관을 위해 로그는 유지)
                deletionLog.setIsPermanentlyDeleted(true);
                deletionLog.setPermanentlyDeletedAt(now);
                userDeletionLogRepository.save(deletionLog);

                deletedCount++;

            } catch (Exception e) {
                log.error("사용자 영구 삭제 중 오류 발생 - userId: {}, email: {}",
                        deletionLog.getUserId(), deletionLog.getEmail(), e);
                // 실패해도 계속 진행
            }
        }

        log.info("=== 회원 영구 삭제 스케줄러 완료 ===");
        log.info("영구 삭제 완료: {}건", deletedCount);
    }
}
