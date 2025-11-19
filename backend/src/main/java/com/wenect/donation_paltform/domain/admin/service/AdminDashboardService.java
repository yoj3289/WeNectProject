package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.CategoryDistributionResponse;
import com.wenect.donation_paltform.domain.admin.dto.DashboardStatsResponse;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * 대시보드 통계 조회
     */
    public DashboardStatsResponse getDashboardStats() {
        // 1. 오늘 기부 금액
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        BigDecimal todayDonation = donationRepository.findAll().stream()
                .filter(d -> d.getDonatedAt() != null &&
                        d.getDonatedAt().isAfter(todayStart) &&
                        d.getDonatedAt().isBefore(todayEnd) &&
                        d.getStatus() == Donation.DonationStatus.COMPLETED)
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. 어제 기부 금액
        LocalDateTime yesterdayStart = LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.MIN);
        LocalDateTime yesterdayEnd = LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.MAX);
        BigDecimal yesterdayDonation = donationRepository.findAll().stream()
                .filter(d -> d.getDonatedAt() != null &&
                        d.getDonatedAt().isAfter(yesterdayStart) &&
                        d.getDonatedAt().isBefore(yesterdayEnd) &&
                        d.getStatus() == Donation.DonationStatus.COMPLETED)
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. 전일 대비 증감률 계산
        Double donationChange = 0.0;
        if (yesterdayDonation.compareTo(BigDecimal.ZERO) > 0) {
            donationChange = todayDonation.subtract(yesterdayDonation)
                    .divide(yesterdayDonation, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        } else if (todayDonation.compareTo(BigDecimal.ZERO) > 0) {
            donationChange = 100.0; // 어제 0원, 오늘 있으면 100% 증가
        }

        // 4. 이번주 신규 회원 (월요일 00:00 ~ 현재)
        LocalDateTime thisWeekStart = LocalDateTime.of(
                LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)),
                LocalTime.MIN
        );
        Long newUsersThisWeek = userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt().isAfter(thisWeekStart))
                .count();

        // 5. 지난주 신규 회원 (지난주 월요일 ~ 일요일)
        LocalDateTime lastWeekStart = thisWeekStart.minusWeeks(1);
        LocalDateTime lastWeekEnd = thisWeekStart.minusSeconds(1);
        Long newUsersLastWeek = userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt().isAfter(lastWeekStart) &&
                        u.getCreatedAt().isBefore(lastWeekEnd))
                .count();

        // 6. 지난주 대비 증감률 계산
        Double userChange = 0.0;
        if (newUsersLastWeek > 0) {
            userChange = ((double) (newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100;
        } else if (newUsersThisWeek > 0) {
            userChange = 100.0;
        }

        return DashboardStatsResponse.builder()
                .todayDonation(todayDonation)
                .donationChange(donationChange)
                .newUsers(newUsersThisWeek)
                .userChange(userChange)
                .pendingApprovals(0)  // 목업 데이터
                .pendingSettlements(0)  // 목업 데이터
                .build();
    }

    /**
     * 카테고리별 프로젝트 분포 조회
     */
    public List<CategoryDistributionResponse> getCategoryDistribution() {
        List<Project> allProjects = projectRepository.findAll();
        long totalCount = allProjects.size();

        if (totalCount == 0) {
            return Collections.emptyList();
        }

        // 카테고리별 프로젝트 수 집계 (categoryId 기준)
        Map<Integer, Long> categoryCount = allProjects.stream()
                .collect(Collectors.groupingBy(Project::getCategoryId, Collectors.counting()));

        // 카테고리 ID별 색상 매핑 (1: Child Welfare, 2: Elder Care, 3: Disability Support, 4: Animal Protection, 5: Environment, 6: Education)
        Map<Integer, String> categoryColors = new HashMap<>();
        categoryColors.put(1, "#FF6B6B");  // Child Welfare
        categoryColors.put(2, "#4ECDC4");  // Elder Care
        categoryColors.put(3, "#45B7D1");  // Disability Support
        categoryColors.put(4, "#FFEAA7");  // Animal Protection
        categoryColors.put(5, "#96CEB4");  // Environment
        categoryColors.put(6, "#BC6C25");  // Education

        // 카테고리 ID별 한글 이름 매핑
        Map<Integer, String> categoryNames = new HashMap<>();
        categoryNames.put(1, "아동·청소년");
        categoryNames.put(2, "어르신");
        categoryNames.put(3, "장애인");
        categoryNames.put(4, "동물보호");
        categoryNames.put(5, "환경");
        categoryNames.put(6, "교육");

        return categoryCount.entrySet().stream()
                .map(entry -> {
                    Integer categoryId = entry.getKey();
                    Long count = entry.getValue();
                    Double percent = (double) count / totalCount * 100;

                    return CategoryDistributionResponse.builder()
                            .name(categoryNames.getOrDefault(categoryId, "기타"))
                            .count(count)
                            .percent(Math.round(percent * 10) / 10.0)  // 소수점 1자리
                            .color(categoryColors.getOrDefault(categoryId, "#CCCCCC"))
                            .build();
                })
                .sorted(Comparator.comparing(CategoryDistributionResponse::getCount).reversed())
                .collect(Collectors.toList());
    }
}
