package com.wenect.donation_paltform.domain.donation.scheduler;

import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 기부 데이터 정리 스케줄러
 * - 오래된 PENDING 상태 기부 자동 삭제
 * - 결제를 시작했지만 완료하지 않은 건 정리
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DonationCleanupScheduler {

    private final DonationRepository donationRepository;

    /**
     * 24시간 이상 된 PENDING 기부 삭제
     * - 실행 시간: 매일 03:00 (오전 3시)
     * - 대상: PENDING 상태이고 생성일이 24시간 이전인 기부
     * - 사유: 결제 페이지에서 이탈한 미완료 결제 건 정리
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldPendingDonations() {
        log.info("=== PENDING 기부 정리 스케줄러 시작 ===");

        // 24시간 전 시점
        LocalDateTime cutoffDate = LocalDateTime.now().minusHours(24);

        int deletedCount = donationRepository.deleteOldPendingDonations(cutoffDate);

        log.info("=== PENDING 기부 정리 스케줄러 완료 ===");
        log.info("삭제된 PENDING 기부: {}건 (기준: {} 이전 생성)", deletedCount, cutoffDate);
    }
}
