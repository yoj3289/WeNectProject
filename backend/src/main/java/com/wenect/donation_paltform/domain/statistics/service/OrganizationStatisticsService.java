package com.wenect.donation_paltform.domain.statistics.service;

import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.statistics.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 기관 프로젝트 통계 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrganizationStatisticsService {

    private final DonationRepository donationRepository;
    private final ProjectRepository projectRepository;

    // 카테고리 ID -> 이름 매핑
    private static final Map<Integer, String> CATEGORY_NAMES = Map.of(
            1, "의료지원",
            2, "교육지원",
            3, "재난구호",
            4, "환경보호",
            5, "아동복지",
            6, "노인복지",
            7, "동물보호",
            8, "문화예술",
            9, "기타"
    );

    /**
     * 기관 전체 통계 요약 조회
     */
    public OrganizationStatisticsSummaryResponse getOrganizationSummary(Long orgId) {
        log.info("기관 전체 통계 요약 조회 - orgId: {}", orgId);

        // 기관의 모든 프로젝트 조회
        List<Project> projects = projectRepository.findByOrgId(orgId);

        if (projects.isEmpty()) {
            return OrganizationStatisticsSummaryResponse.builder()
                    .totalProjects(0)
                    .activeProjects(0)
                    .completedProjects(0)
                    .closedProjects(0)
                    .totalDonationAmount(BigDecimal.ZERO)
                    .totalDonorCount(0)
                    .totalDonationCount(0)
                    .averageDonation(BigDecimal.ZERO)
                    .averageAchievementRate(BigDecimal.ZERO)
                    .build();
        }

        // 상태별 프로젝트 수 계산
        long activeCount = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .count();
        long completedCount = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED ||
                           p.getStatus() == Project.ProjectStatus.SETTLEMENT)
                .count();
        long closedCount = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.CLOSED)
                .count();

        // 총 기부액 및 기부자 수
        BigDecimal totalDonationAmount = projects.stream()
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalDonorCount = projects.stream()
                .mapToInt(Project::getDonorCount)
                .sum();

        // 모든 프로젝트의 기부 내역 조회
        List<Long> projectIds = projects.stream()
                .map(Project::getProjectId)
                .collect(Collectors.toList());

        int totalDonationCount = 0;
        for (Long projectId : projectIds) {
            List<Donation> donations = donationRepository.findByProjectIdAndStatus(
                    projectId, Donation.DonationStatus.COMPLETED);
            totalDonationCount += donations.size();
        }

        // 평균 기부액
        BigDecimal averageDonation = totalDonationCount > 0
                ? totalDonationAmount.divide(BigDecimal.valueOf(totalDonationCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 평균 달성률
        BigDecimal totalAchievementRate = projects.stream()
                .map(p -> {
                    if (p.getTargetAmount().compareTo(BigDecimal.ZERO) == 0) {
                        return BigDecimal.ZERO;
                    }
                    return p.getCurrentAmount()
                            .divide(p.getTargetAmount(), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageAchievementRate = !projects.isEmpty()
                ? totalAchievementRate.divide(BigDecimal.valueOf(projects.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return OrganizationStatisticsSummaryResponse.builder()
                .totalProjects(projects.size())
                .activeProjects((int) activeCount)
                .completedProjects((int) completedCount)
                .closedProjects((int) closedCount)
                .totalDonationAmount(totalDonationAmount)
                .totalDonorCount(totalDonorCount)
                .totalDonationCount(totalDonationCount)
                .averageDonation(averageDonation)
                .averageAchievementRate(averageAchievementRate)
                .build();
    }

    /**
     * 개별 프로젝트 통계 목록 조회
     */
    public List<ProjectStatisticsResponse> getProjectStatistics(Long orgId) {
        log.info("개별 프로젝트 통계 목록 조회 - orgId: {}", orgId);

        List<Project> projects = projectRepository.findByOrgId(orgId);

        return projects.stream()
                .map(project -> {
                    // 해당 프로젝트의 완료된 기부 건수
                    List<Donation> donations = donationRepository.findByProjectIdAndStatus(
                            project.getProjectId(), Donation.DonationStatus.COMPLETED);
                    int donationCount = donations.size();

                    // 달성률 계산
                    BigDecimal achievementRate = BigDecimal.ZERO;
                    if (project.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
                        achievementRate = project.getCurrentAmount()
                                .divide(project.getTargetAmount(), 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .setScale(2, RoundingMode.HALF_UP);
                    }

                    // 평균 기부액
                    BigDecimal averageDonation = donationCount > 0
                            ? project.getCurrentAmount().divide(BigDecimal.valueOf(donationCount), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    return ProjectStatisticsResponse.builder()
                            .projectId(project.getProjectId())
                            .projectTitle(project.getTitle())
                            .status(project.getStatus().name())
                            .categoryId(project.getCategoryId())
                            .categoryName(CATEGORY_NAMES.getOrDefault(project.getCategoryId(), "기타"))
                            .targetAmount(project.getTargetAmount())
                            .currentAmount(project.getCurrentAmount())
                            .achievementRate(achievementRate)
                            .donorCount(project.getDonorCount())
                            .donationCount(donationCount)
                            .averageDonation(averageDonation)
                            .startDate(project.getStartDate().toString())
                            .endDate(project.getEndDate().toString())
                            .build();
                })
                .sorted(Comparator.comparing(ProjectStatisticsResponse::getProjectId).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 프로젝트 기부 트렌드 조회 (기관의 모든 프로젝트 또는 특정 프로젝트)
     */
    public List<ProjectDonationTrendResponse> getProjectDonationTrends(
            Long orgId, Long projectId, String period) {
        log.info("프로젝트 기부 트렌드 조회 - orgId: {}, projectId: {}, period: {}", orgId, projectId, period);

        List<Donation> donations;

        if (projectId != null) {
            // 특정 프로젝트의 기부 내역
            donations = donationRepository.findByProjectIdAndStatus(projectId, Donation.DonationStatus.COMPLETED);
        } else {
            // 기관의 모든 프로젝트 기부 내역
            List<Project> projects = projectRepository.findByOrgId(orgId);
            List<Long> projectIds = projects.stream()
                    .map(Project::getProjectId)
                    .collect(Collectors.toList());

            donations = new ArrayList<>();
            for (Long pid : projectIds) {
                donations.addAll(donationRepository.findByProjectIdAndStatus(pid, Donation.DonationStatus.COMPLETED));
            }
        }

        if ("yearly".equals(period)) {
            return getYearlyTrends(donations);
        } else if ("weekly".equals(period)) {
            return getWeeklyTrends(donations);
        } else {
            return getMonthlyTrends(donations);
        }
    }

    /**
     * 월별 트렌드
     */
    private List<ProjectDonationTrendResponse> getMonthlyTrends(List<Donation> donations) {
        Map<String, List<Donation>> groupedByMonth = donations.stream()
                .collect(Collectors.groupingBy(d ->
                        d.getDonatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                ));

        return groupedByMonth.entrySet().stream()
                .map(entry -> {
                    String periodStr = entry.getKey();
                    List<Donation> monthDonations = entry.getValue();
                    BigDecimal totalAmount = monthDonations.stream()
                            .map(Donation::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // 기부자 수 (중복 제거)
                    int donorCount = (int) monthDonations.stream()
                            .map(Donation::getUserId)
                            .distinct()
                            .count();

                    return ProjectDonationTrendResponse.builder()
                            .period(periodStr)
                            .totalAmount(totalAmount)
                            .donationCount(monthDonations.size())
                            .donorCount(donorCount)
                            .build();
                })
                .sorted(Comparator.comparing(ProjectDonationTrendResponse::getPeriod).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 주간 트렌드
     */
    private List<ProjectDonationTrendResponse> getWeeklyTrends(List<Donation> donations) {
        Map<String, List<Donation>> groupedByWeek = donations.stream()
                .collect(Collectors.groupingBy(d -> {
                    // 해당 주의 월요일(시작일)과 일요일(종료일) 계산
                    java.time.LocalDateTime dateTime = d.getDonatedAt();
                    java.time.LocalDate date = dateTime.toLocalDate();
                    java.time.LocalDate weekStart = date.with(java.time.DayOfWeek.MONDAY);
                    java.time.LocalDate weekEnd = date.with(java.time.DayOfWeek.SUNDAY);
                    return String.format("%02d/%02d~%02d/%02d",
                            weekStart.getMonthValue(), weekStart.getDayOfMonth(),
                            weekEnd.getMonthValue(), weekEnd.getDayOfMonth());
                }));

        return groupedByWeek.entrySet().stream()
                .map(entry -> {
                    String periodStr = entry.getKey();
                    List<Donation> weekDonations = entry.getValue();
                    BigDecimal totalAmount = weekDonations.stream()
                            .map(Donation::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // 기부자 수 (중복 제거)
                    int donorCount = (int) weekDonations.stream()
                            .map(Donation::getUserId)
                            .distinct()
                            .count();

                    return ProjectDonationTrendResponse.builder()
                            .period(periodStr)
                            .totalAmount(totalAmount)
                            .donationCount(weekDonations.size())
                            .donorCount(donorCount)
                            .build();
                })
                .sorted(Comparator.comparing(ProjectDonationTrendResponse::getPeriod).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 연별 트렌드
     */
    private List<ProjectDonationTrendResponse> getYearlyTrends(List<Donation> donations) {
        Map<String, List<Donation>> groupedByYear = donations.stream()
                .collect(Collectors.groupingBy(d ->
                        String.valueOf(d.getDonatedAt().getYear())
                ));

        return groupedByYear.entrySet().stream()
                .map(entry -> {
                    String periodStr = entry.getKey();
                    List<Donation> yearDonations = entry.getValue();
                    BigDecimal totalAmount = yearDonations.stream()
                            .map(Donation::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // 기부자 수 (중복 제거)
                    int donorCount = (int) yearDonations.stream()
                            .map(Donation::getUserId)
                            .distinct()
                            .count();

                    return ProjectDonationTrendResponse.builder()
                            .period(periodStr)
                            .totalAmount(totalAmount)
                            .donationCount(yearDonations.size())
                            .donorCount(donorCount)
                            .build();
                })
                .sorted(Comparator.comparing(ProjectDonationTrendResponse::getPeriod).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 특정 프로젝트 상세 통계 조회
     */
    public ProjectStatisticsResponse getProjectDetailStatistics(Long orgId, Long projectId) {
        log.info("프로젝트 상세 통계 조회 - orgId: {}, projectId: {}", orgId, projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 기관 소유 확인
        if (!project.getOrgId().equals(orgId)) {
            throw new IllegalArgumentException("해당 프로젝트에 대한 접근 권한이 없습니다.");
        }

        // 해당 프로젝트의 완료된 기부 건수
        List<Donation> donations = donationRepository.findByProjectIdAndStatus(
                projectId, Donation.DonationStatus.COMPLETED);
        int donationCount = donations.size();

        // 달성률 계산
        BigDecimal achievementRate = BigDecimal.ZERO;
        if (project.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            achievementRate = project.getCurrentAmount()
                    .divide(project.getTargetAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // 평균 기부액
        BigDecimal averageDonation = donationCount > 0
                ? project.getCurrentAmount().divide(BigDecimal.valueOf(donationCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ProjectStatisticsResponse.builder()
                .projectId(project.getProjectId())
                .projectTitle(project.getTitle())
                .status(project.getStatus().name())
                .categoryId(project.getCategoryId())
                .categoryName(CATEGORY_NAMES.getOrDefault(project.getCategoryId(), "기타"))
                .targetAmount(project.getTargetAmount())
                .currentAmount(project.getCurrentAmount())
                .achievementRate(achievementRate)
                .donorCount(project.getDonorCount())
                .donationCount(donationCount)
                .averageDonation(averageDonation)
                .startDate(project.getStartDate().toString())
                .endDate(project.getEndDate().toString())
                .build();
    }
}
