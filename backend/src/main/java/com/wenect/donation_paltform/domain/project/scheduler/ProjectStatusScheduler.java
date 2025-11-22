package com.wenect.donation_paltform.domain.project.scheduler;

import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import com.wenect.donation_paltform.domain.piggybank.repository.PiggyBankRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 프로젝트 상태 자동 업데이트 스케줄러
 * - 매일 자정(00:00)에 실행
 * - 기간이 만료된 ACTIVE 프로젝트를 COMPLETED로 변경
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ProjectStatusScheduler {

    private final ProjectRepository projectRepository;
    private final PiggyBankRepository piggyBankRepository;

    /**
     * 기간 만료 프로젝트 자동 완료 처리
     * - 실행 시간: 매일 00:00 (자정)
     * - 대상: endDate < 오늘 날짜인 ACTIVE 프로젝트
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void updateExpiredProjects() {
        log.info("=== 프로젝트 상태 자동 업데이트 시작 ===");

        LocalDate today = LocalDate.now();

        // 최적화: 만료된 ACTIVE 프로젝트만 조회 (DB에서 필터링)
        List<Project> expiredProjects = projectRepository.findExpiredActiveProjects(today);

        log.info("만료된 프로젝트: {}개", expiredProjects.size());

        int completedCount = 0;

        for (Project project : expiredProjects) {
            // 기간 만료 확인 불필요 (쿼리에서 이미 필터링됨)
            project.setStatus(Project.ProjectStatus.COMPLETED);
            projectRepository.save(project);

            // 저금통 자동 생성 (초기 금액 0, 중복 체크)
            boolean piggyBankExists = piggyBankRepository.findByProjectId(project.getProjectId()).isPresent();
            if (!piggyBankExists) {
                PiggyBank piggyBank = PiggyBank.builder()
                        .projectId(project.getProjectId())
                        .totalAmount(java.math.BigDecimal.ZERO)
                        .withdrawnAmount(java.math.BigDecimal.ZERO)
                        .balance(java.math.BigDecimal.ZERO)
                        .status(PiggyBank.PiggyBankStatus.ACTIVE)
                        .build();
                piggyBankRepository.save(piggyBank);

                log.info("프로젝트 기간 만료로 완료 처리 및 저금통 생성 - projectId: {}, title: {}, endDate: {}, piggyId: {}",
                        project.getProjectId(), project.getTitle(), project.getEndDate(), piggyBank.getPiggyId());
            } else {
                log.info("프로젝트 기간 만료로 완료 처리 - projectId: {}, title: {}, endDate: {} (저금통 이미 존재)",
                        project.getProjectId(), project.getTitle(), project.getEndDate());
            }

            completedCount++;
        }

        log.info("=== 프로젝트 상태 자동 업데이트 완료 ===");
        log.info("완료 처리된 프로젝트: {}개", completedCount);
    }
}
