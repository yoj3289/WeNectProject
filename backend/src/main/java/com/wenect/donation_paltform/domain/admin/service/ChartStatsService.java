package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.ChartStatsResponse.*;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChartStatsService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * 기부 추이 조회 (주간/월간)
     */
    public DonationTrendResponse getDonationTrend(String period) {
        List<Donation> donations = donationRepository.findAll().stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        List<DonationTrend> trendData;

        if ("monthly".equals(period)) {
            trendData = getMonthlyDonationTrend(donations);
        } else {
            trendData = getWeeklyDonationTrend(donations);
        }

        BigDecimal totalAmount = trendData.stream()
                .map(DonationTrend::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Long totalCount = trendData.stream()
                .mapToLong(DonationTrend::getCount)
                .sum();

        return DonationTrendResponse.builder()
                .period(period)
                .data(trendData)
                .totalAmount(totalAmount)
                .totalCount(totalCount)
                .build();
    }

    /**
     * 주간 기부 추이 (최근 8주)
     */
    private List<DonationTrend> getWeeklyDonationTrend(List<Donation> donations) {
        List<DonationTrend> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (int i = 7; i >= 0; i--) {
            LocalDate start = weekStart.minusWeeks(i);
            LocalDate end = start.plusDays(6);
            LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
            LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

            BigDecimal amount = donations.stream()
                    .filter(d -> d.getDonatedAt() != null &&
                            !d.getDonatedAt().isBefore(startDateTime) &&
                            !d.getDonatedAt().isAfter(endDateTime))
                    .map(Donation::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Long count = donations.stream()
                    .filter(d -> d.getDonatedAt() != null &&
                            !d.getDonatedAt().isBefore(startDateTime) &&
                            !d.getDonatedAt().isAfter(endDateTime))
                    .count();

            String label = start.format(DateTimeFormatter.ofPattern("M/d"));

            result.add(DonationTrend.builder()
                    .label(label)
                    .amount(amount)
                    .count(count)
                    .build());
        }

        return result;
    }

    /**
     * 월간 기부 추이 (최근 12개월)
     */
    private List<DonationTrend> getMonthlyDonationTrend(List<Donation> donations) {
        List<DonationTrend> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            LocalDate start = month.withDayOfMonth(1);
            LocalDate end = month.with(TemporalAdjusters.lastDayOfMonth());
            LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
            LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

            BigDecimal amount = donations.stream()
                    .filter(d -> d.getDonatedAt() != null &&
                            !d.getDonatedAt().isBefore(startDateTime) &&
                            !d.getDonatedAt().isAfter(endDateTime))
                    .map(Donation::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Long count = donations.stream()
                    .filter(d -> d.getDonatedAt() != null &&
                            !d.getDonatedAt().isBefore(startDateTime) &&
                            !d.getDonatedAt().isAfter(endDateTime))
                    .count();

            String label = month.format(DateTimeFormatter.ofPattern("M월"));

            result.add(DonationTrend.builder()
                    .label(label)
                    .amount(amount)
                    .count(count)
                    .build());
        }

        return result;
    }

    /**
     * 사용자 가입 추이 조회 (주간/월간)
     */
    public UserTrendResponse getUserTrend(String period) {
        List<User> users = userRepository.findAll();

        List<UserTrend> trendData;

        if ("monthly".equals(period)) {
            trendData = getMonthlyUserTrend(users);
        } else {
            trendData = getWeeklyUserTrend(users);
        }

        Long totalIndividual = trendData.stream()
                .mapToLong(UserTrend::getIndividual)
                .sum();

        Long totalOrganization = trendData.stream()
                .mapToLong(UserTrend::getOrganization)
                .sum();

        return UserTrendResponse.builder()
                .period(period)
                .data(trendData)
                .totalIndividual(totalIndividual)
                .totalOrganization(totalOrganization)
                .build();
    }

    /**
     * 주간 사용자 가입 추이 (최근 8주)
     */
    private List<UserTrend> getWeeklyUserTrend(List<User> users) {
        List<UserTrend> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (int i = 7; i >= 0; i--) {
            LocalDate start = weekStart.minusWeeks(i);
            LocalDate end = start.plusDays(6);
            LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
            LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

            Long individual = users.stream()
                    .filter(u -> u.getCreatedAt() != null &&
                            !u.getCreatedAt().isBefore(startDateTime) &&
                            !u.getCreatedAt().isAfter(endDateTime) &&
                            u.getUserType() == User.UserType.INDIVIDUAL)
                    .count();

            Long organization = users.stream()
                    .filter(u -> u.getCreatedAt() != null &&
                            !u.getCreatedAt().isBefore(startDateTime) &&
                            !u.getCreatedAt().isAfter(endDateTime) &&
                            u.getUserType() == User.UserType.ORGANIZATION)
                    .count();

            String label = start.format(DateTimeFormatter.ofPattern("M/d"));

            result.add(UserTrend.builder()
                    .label(label)
                    .individual(individual)
                    .organization(organization)
                    .total(individual + organization)
                    .build());
        }

        return result;
    }

    /**
     * 월간 사용자 가입 추이 (최근 12개월)
     */
    private List<UserTrend> getMonthlyUserTrend(List<User> users) {
        List<UserTrend> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            LocalDate start = month.withDayOfMonth(1);
            LocalDate end = month.with(TemporalAdjusters.lastDayOfMonth());
            LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
            LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

            Long individual = users.stream()
                    .filter(u -> u.getCreatedAt() != null &&
                            !u.getCreatedAt().isBefore(startDateTime) &&
                            !u.getCreatedAt().isAfter(endDateTime) &&
                            u.getUserType() == User.UserType.INDIVIDUAL)
                    .count();

            Long organization = users.stream()
                    .filter(u -> u.getCreatedAt() != null &&
                            !u.getCreatedAt().isBefore(startDateTime) &&
                            !u.getCreatedAt().isAfter(endDateTime) &&
                            u.getUserType() == User.UserType.ORGANIZATION)
                    .count();

            String label = month.format(DateTimeFormatter.ofPattern("M월"));

            result.add(UserTrend.builder()
                    .label(label)
                    .individual(individual)
                    .organization(organization)
                    .total(individual + organization)
                    .build());
        }

        return result;
    }

    /**
     * 프로젝트 통계 및 추이 조회 (주간/월간)
     */
    public ProjectStatsResponse getProjectStats(String period) {
        List<Project> projects = projectRepository.findAll();

        // 상태별 통계 (전체, 진행 중, 결산 중, 종료, 반려)
        // - 진행 중: ACTIVE
        // - 결산 중: COMPLETED, SETTLEMENT (프론트엔드 "결산 중" 탭과 동일)
        // - 종료: CLOSED
        // - 반려: REJECTED
        Long ongoing = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .count();
        Long settlement = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.SETTLEMENT ||
                            p.getStatus() == Project.ProjectStatus.COMPLETED)
                .count();
        Long closed = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.CLOSED)
                .count();
        Long rejected = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.REJECTED)
                .count();

        ProjectStats stats = ProjectStats.builder()
                .ongoing(ongoing)
                .settlement(settlement)
                .closed(closed)
                .rejected(rejected)
                .total((long) projects.size())
                .build();

        // 추이 데이터
        List<ProjectTrend> trendData;
        if ("monthly".equals(period)) {
            trendData = getMonthlyProjectTrend(projects);
        } else {
            trendData = getWeeklyProjectTrend(projects);
        }

        return ProjectStatsResponse.builder()
                .stats(stats)
                .trend(trendData)
                .period(period)
                .build();
    }

    /**
     * 주간 프로젝트 추이 (최근 8주)
     */
    private List<ProjectTrend> getWeeklyProjectTrend(List<Project> projects) {
        List<ProjectTrend> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (int i = 7; i >= 0; i--) {
            LocalDate start = weekStart.minusWeeks(i);
            LocalDate end = start.plusDays(6);
            LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
            LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

            Long newProjects = projects.stream()
                    .filter(p -> p.getCreatedAt() != null &&
                            !p.getCreatedAt().isBefore(startDateTime) &&
                            !p.getCreatedAt().isAfter(endDateTime))
                    .count();

            Long completedProjects = projects.stream()
                    .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED &&
                            p.getEndDate() != null &&
                            !p.getEndDate().isBefore(start) &&
                            !p.getEndDate().isAfter(end))
                    .count();

            String label = start.format(DateTimeFormatter.ofPattern("M/d"));

            result.add(ProjectTrend.builder()
                    .label(label)
                    .newProjects(newProjects)
                    .completedProjects(completedProjects)
                    .build());
        }

        return result;
    }

    /**
     * 월간 프로젝트 추이 (최근 12개월)
     */
    private List<ProjectTrend> getMonthlyProjectTrend(List<Project> projects) {
        List<ProjectTrend> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            LocalDate start = month.withDayOfMonth(1);
            LocalDate end = month.with(TemporalAdjusters.lastDayOfMonth());
            LocalDateTime startDateTime = LocalDateTime.of(start, LocalTime.MIN);
            LocalDateTime endDateTime = LocalDateTime.of(end, LocalTime.MAX);

            Long newProjects = projects.stream()
                    .filter(p -> p.getCreatedAt() != null &&
                            !p.getCreatedAt().isBefore(startDateTime) &&
                            !p.getCreatedAt().isAfter(endDateTime))
                    .count();

            Long completedProjects = projects.stream()
                    .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED &&
                            p.getEndDate() != null &&
                            !p.getEndDate().isBefore(start) &&
                            !p.getEndDate().isAfter(end))
                    .count();

            String label = month.format(DateTimeFormatter.ofPattern("M월"));

            result.add(ProjectTrend.builder()
                    .label(label)
                    .newProjects(newProjects)
                    .completedProjects(completedProjects)
                    .build());
        }

        return result;
    }
}
