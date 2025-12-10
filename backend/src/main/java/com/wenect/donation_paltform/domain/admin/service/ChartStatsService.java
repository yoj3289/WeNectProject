package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.ChartStatsResponse.*;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
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

/**
 * 차트 통계 서비스
 * [성능 개선] findAll() -> 집계 쿼리로 변경
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChartStatsService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * 기부 추이 조회 (주간/월간)
     * [성능 개선] 집계 쿼리 사용
     */
    public DonationTrendResponse getDonationTrend(String period) {
        List<DonationTrend> trendData;

        if ("monthly".equals(period)) {
            trendData = getMonthlyDonationTrend();
        } else {
            trendData = getWeeklyDonationTrend();
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
     * 주간 기부 추이 (최근 8주) - 집계 쿼리 사용
     */
    private List<DonationTrend> getWeeklyDonationTrend() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate startDate = weekStart.minusWeeks(7);

        LocalDateTime startDateTime = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(today, LocalTime.MAX);

        // DB에서 일별 집계 데이터 조회
        List<Object[]> stats = donationRepository.findDonationStatsByDateRange(startDateTime, endDateTime);

        // 일별 데이터를 Map으로 변환
        Map<String, BigDecimal> amountMap = new HashMap<>();
        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : stats) {
            String dateStr = (String) row[0];
            BigDecimal amount = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            Long count = ((Number) row[2]).longValue();
            amountMap.put(dateStr, amount);
            countMap.put(dateStr, count);
        }

        // 주간 데이터로 집계
        List<DonationTrend> result = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate start = weekStart.minusWeeks(i);
            LocalDate end = start.plusDays(6);

            BigDecimal weekAmount = BigDecimal.ZERO;
            Long weekCount = 0L;

            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                weekAmount = weekAmount.add(amountMap.getOrDefault(dateStr, BigDecimal.ZERO));
                weekCount += countMap.getOrDefault(dateStr, 0L);
            }

            String label = start.format(DateTimeFormatter.ofPattern("M/d"));
            result.add(DonationTrend.builder()
                    .label(label)
                    .amount(weekAmount)
                    .count(weekCount)
                    .build());
        }

        return result;
    }

    /**
     * 월간 기부 추이 (최근 12개월) - 집계 쿼리 사용
     */
    private List<DonationTrend> getMonthlyDonationTrend() {
        LocalDate today = LocalDate.now();
        LocalDate startMonth = today.minusMonths(11).withDayOfMonth(1);

        LocalDateTime startDateTime = LocalDateTime.of(startMonth, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(today, LocalTime.MAX);

        // DB에서 월별 집계 데이터 조회
        List<Object[]> stats = donationRepository.findMonthlyDonationStats(startDateTime, endDateTime);

        // 월별 데이터를 Map으로 변환
        Map<String, BigDecimal> amountMap = new HashMap<>();
        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : stats) {
            String monthStr = (String) row[0];
            BigDecimal amount = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            Long count = ((Number) row[2]).longValue();
            amountMap.put(monthStr, amount);
            countMap.put(monthStr, count);
        }

        // 12개월 데이터 생성 (데이터 없는 월은 0으로)
        List<DonationTrend> result = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            String monthKey = month.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String label = month.format(DateTimeFormatter.ofPattern("M월"));

            result.add(DonationTrend.builder()
                    .label(label)
                    .amount(amountMap.getOrDefault(monthKey, BigDecimal.ZERO))
                    .count(countMap.getOrDefault(monthKey, 0L))
                    .build());
        }

        return result;
    }

    /**
     * 사용자 가입 추이 조회 (주간/월간)
     * [성능 개선] 집계 쿼리 사용
     */
    public UserTrendResponse getUserTrend(String period) {
        List<UserTrend> trendData;

        if ("monthly".equals(period)) {
            trendData = getMonthlyUserTrend();
        } else {
            trendData = getWeeklyUserTrend();
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
     * 주간 사용자 가입 추이 (최근 8주) - 집계 쿼리 사용
     */
    private List<UserTrend> getWeeklyUserTrend() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate startDate = weekStart.minusWeeks(7);

        LocalDateTime startDateTime = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(today, LocalTime.MAX);

        // DB에서 일별/타입별 집계 데이터 조회
        List<Object[]> stats = userRepository.findUserStatsByDateRange(startDateTime, endDateTime);

        // 일별/타입별 데이터를 Map으로 변환
        Map<String, Long> individualMap = new HashMap<>();
        Map<String, Long> organizationMap = new HashMap<>();
        for (Object[] row : stats) {
            String dateStr = (String) row[0];
            User.UserType userType = (User.UserType) row[1];
            Long count = ((Number) row[2]).longValue();

            if (userType == User.UserType.INDIVIDUAL) {
                individualMap.put(dateStr, count);
            } else if (userType == User.UserType.ORGANIZATION) {
                organizationMap.put(dateStr, count);
            }
        }

        // 주간 데이터로 집계
        List<UserTrend> result = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate start = weekStart.minusWeeks(i);
            LocalDate end = start.plusDays(6);

            Long weekIndividual = 0L;
            Long weekOrganization = 0L;

            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                weekIndividual += individualMap.getOrDefault(dateStr, 0L);
                weekOrganization += organizationMap.getOrDefault(dateStr, 0L);
            }

            String label = start.format(DateTimeFormatter.ofPattern("M/d"));
            result.add(UserTrend.builder()
                    .label(label)
                    .individual(weekIndividual)
                    .organization(weekOrganization)
                    .total(weekIndividual + weekOrganization)
                    .build());
        }

        return result;
    }

    /**
     * 월간 사용자 가입 추이 (최근 12개월) - 집계 쿼리 사용
     */
    private List<UserTrend> getMonthlyUserTrend() {
        LocalDate today = LocalDate.now();
        LocalDate startMonth = today.minusMonths(11).withDayOfMonth(1);

        LocalDateTime startDateTime = LocalDateTime.of(startMonth, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(today, LocalTime.MAX);

        // DB에서 월별/타입별 집계 데이터 조회
        List<Object[]> stats = userRepository.findMonthlyUserStats(startDateTime, endDateTime);

        // 월별/타입별 데이터를 Map으로 변환
        Map<String, Long> individualMap = new HashMap<>();
        Map<String, Long> organizationMap = new HashMap<>();
        for (Object[] row : stats) {
            String monthStr = (String) row[0];
            User.UserType userType = (User.UserType) row[1];
            Long count = ((Number) row[2]).longValue();

            if (userType == User.UserType.INDIVIDUAL) {
                individualMap.put(monthStr, count);
            } else if (userType == User.UserType.ORGANIZATION) {
                organizationMap.put(monthStr, count);
            }
        }

        // 12개월 데이터 생성
        List<UserTrend> result = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            String monthKey = month.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String label = month.format(DateTimeFormatter.ofPattern("M월"));

            Long individual = individualMap.getOrDefault(monthKey, 0L);
            Long organization = organizationMap.getOrDefault(monthKey, 0L);

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
     * [성능 개선] 집계 쿼리 사용
     */
    public ProjectStatsResponse getProjectStats(String period) {
        // 상태별 프로젝트 수를 DB에서 직접 조회
        Long ongoing = projectRepository.countByStatus(Project.ProjectStatus.ACTIVE);
        Long completed = projectRepository.countByStatus(Project.ProjectStatus.COMPLETED);
        Long settlementStatus = projectRepository.countByStatus(Project.ProjectStatus.SETTLEMENT);
        Long closed = projectRepository.countByStatus(Project.ProjectStatus.CLOSED);
        Long rejected = projectRepository.countByStatus(Project.ProjectStatus.REJECTED);

        // 결산 중 = COMPLETED + SETTLEMENT
        Long settlement = completed + settlementStatus;

        ProjectStats stats = ProjectStats.builder()
                .ongoing(ongoing)
                .settlement(settlement)
                .closed(closed)
                .rejected(rejected)
                .total(ongoing + settlement + closed + rejected)
                .build();

        // 추이 데이터
        List<ProjectTrend> trendData;
        if ("monthly".equals(period)) {
            trendData = getMonthlyProjectTrend();
        } else {
            trendData = getWeeklyProjectTrend();
        }

        return ProjectStatsResponse.builder()
                .stats(stats)
                .trend(trendData)
                .period(period)
                .build();
    }

    /**
     * 주간 프로젝트 추이 (최근 8주) - 집계 쿼리 사용
     */
    private List<ProjectTrend> getWeeklyProjectTrend() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate startDate = weekStart.minusWeeks(7);

        LocalDateTime startDateTime = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(today, LocalTime.MAX);

        // DB에서 일별 생성 통계 조회
        List<Object[]> stats = projectRepository.findProjectStatsByDateRange(startDateTime, endDateTime);

        // 일별 데이터를 Map으로 변환
        Map<String, Long> newProjectMap = new HashMap<>();
        for (Object[] row : stats) {
            String dateStr = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            newProjectMap.put(dateStr, count);
        }

        // 주간 데이터로 집계
        List<ProjectTrend> result = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate start = weekStart.minusWeeks(i);
            LocalDate end = start.plusDays(6);

            Long weekNewProjects = 0L;
            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                weekNewProjects += newProjectMap.getOrDefault(dateStr, 0L);
            }

            // 완료된 프로젝트 수 (해당 주에 endDate가 있는 COMPLETED 프로젝트)
            Long completedProjects = projectRepository.countByStatusAndEndDateBetween(
                    com.wenect.donation_paltform.domain.project.entity.Project.ProjectStatus.COMPLETED, start, end);

            String label = start.format(DateTimeFormatter.ofPattern("M/d"));
            result.add(ProjectTrend.builder()
                    .label(label)
                    .newProjects(weekNewProjects)
                    .completedProjects(completedProjects != null ? completedProjects : 0L)
                    .build());
        }

        return result;
    }

    /**
     * 월간 프로젝트 추이 (최근 12개월) - 집계 쿼리 사용
     */
    private List<ProjectTrend> getMonthlyProjectTrend() {
        LocalDate today = LocalDate.now();
        LocalDate startMonth = today.minusMonths(11).withDayOfMonth(1);

        LocalDateTime startDateTime = LocalDateTime.of(startMonth, LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.of(today, LocalTime.MAX);

        // DB에서 월별 생성 통계 조회
        List<Object[]> stats = projectRepository.findMonthlyProjectStats(startDateTime, endDateTime);

        // 월별 데이터를 Map으로 변환
        Map<String, Long> newProjectMap = new HashMap<>();
        for (Object[] row : stats) {
            String monthStr = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            newProjectMap.put(monthStr, count);
        }

        // 12개월 데이터 생성
        List<ProjectTrend> result = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            LocalDate monthStart = month.withDayOfMonth(1);
            LocalDate monthEnd = month.with(TemporalAdjusters.lastDayOfMonth());

            String monthKey = month.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            String label = month.format(DateTimeFormatter.ofPattern("M월"));

            // 완료된 프로젝트 수 (해당 월에 endDate가 있는 COMPLETED 프로젝트)
            Long completedProjects = projectRepository.countByStatusAndEndDateBetween(
                    com.wenect.donation_paltform.domain.project.entity.Project.ProjectStatus.COMPLETED, monthStart, monthEnd);

            result.add(ProjectTrend.builder()
                    .label(label)
                    .newProjects(newProjectMap.getOrDefault(monthKey, 0L))
                    .completedProjects(completedProjects != null ? completedProjects : 0L)
                    .build());
        }

        return result;
    }
}
