package com.wenect.donation_paltform.domain.project.scheduler;

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
        List<Project> activeProjects = projectRepository.findByStatus(Project.ProjectStatus.ACTIVE);

        log.info("검사 대상 ACTIVE 프로젝트: {}개", activeProjects.size());

        int completedCount = 0;

        for (Project project : activeProjects) {
            // 기간 만료 확인
            if (today.isAfter(project.getEndDate())) {
                project.setStatus(Project.ProjectStatus.COMPLETED);
                projectRepository.save(project);

                log.info("프로젝트 기간 만료로 완료 처리 - projectId: {}, title: {}, endDate: {}",
                        project.getProjectId(), project.getTitle(), project.getEndDate());

                completedCount++;
            }
        }

        log.info("=== 프로젝트 상태 자동 업데이트 완료 ===");
        log.info("완료 처리된 프로젝트: {}개", completedCount);
    }
}
