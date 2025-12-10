package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.CategoryDistributionResponse;
import com.wenect.donation_paltform.domain.admin.dto.DashboardStatsResponse;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.settlement.entity.Settlement;
import com.wenect.donation_paltform.domain.settlement.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
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
    private final com.wenect.donation_paltform.domain.expense.repository.ExpenseRepository expenseRepository;
    private final OrganizationRepository organizationRepository;
    private final SettlementRepository settlementRepository;

    /**
     * 대시보드 통계 조회
     * [성능 개선] findAll() -> 집계 쿼리로 변경
     */
    public DashboardStatsResponse getDashboardStats() {
        // 1. 오늘 기부 금액 (집계 쿼리 사용)
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        BigDecimal todayDonation = donationRepository.sumAmountByStatusAndDonatedAtBetween(todayStart, todayEnd);
        if (todayDonation == null) todayDonation = BigDecimal.ZERO;

        // 2. 어제 기부 금액 (집계 쿼리 사용)
        LocalDateTime yesterdayStart = LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.MIN);
        LocalDateTime yesterdayEnd = LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.MAX);
        BigDecimal yesterdayDonation = donationRepository.sumAmountByStatusAndDonatedAtBetween(yesterdayStart, yesterdayEnd);
        if (yesterdayDonation == null) yesterdayDonation = BigDecimal.ZERO;

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

        // 4. 이번주 신규 회원 (집계 쿼리 사용)
        LocalDateTime thisWeekStart = LocalDateTime.of(
                LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)),
                LocalTime.MIN
        );
        LocalDateTime now = LocalDateTime.now();
        Long newUsersThisWeek = userRepository.countByCreatedAtBetween(thisWeekStart, now);

        // 5. 지난주 신규 회원 (집계 쿼리 사용)
        LocalDateTime lastWeekStart = thisWeekStart.minusWeeks(1);
        LocalDateTime lastWeekEnd = thisWeekStart.minusSeconds(1);
        Long newUsersLastWeek = userRepository.countByCreatedAtBetween(lastWeekStart, lastWeekEnd);

        // 6. 지난주 대비 증감률 계산
        Double userChange = 0.0;
        if (newUsersLastWeek > 0) {
            userChange = ((double) (newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100;
        } else if (newUsersThisWeek > 0) {
            userChange = 100.0;
        }

        // 7. 지출 승인 대기 건수 (count 쿼리 사용)
        Long pendingExpenses = expenseRepository.countByStatus(
                com.wenect.donation_paltform.domain.expense.entity.Expense.ExpenseStatus.PENDING
        );

        // 8. 기관 승인 대기 건수 (이미 count 쿼리 사용 중)
        Long pendingApprovals = organizationRepository.countByApprovalStatus(Organization.ApprovalStatus.PENDING);

        // 9. 정산 승인 대기 건수 (이미 count 쿼리 사용 중)
        Long pendingSettlements = settlementRepository.countByStatus(Settlement.SettlementStatus.PENDING);

        return DashboardStatsResponse.builder()
                .todayDonation(todayDonation)
                .donationChange(donationChange)
                .newUsers(newUsersThisWeek)
                .userChange(userChange)
                .pendingApprovals(pendingApprovals)
                .pendingSettlements(pendingSettlements)
                .pendingExpenses(pendingExpenses)
                .build();
    }

    /**
     * 카테고리별 프로젝트 분포 조회
     * [성능 개선] findAll() -> 집계 쿼리로 변경
     */
    public List<CategoryDistributionResponse> getCategoryDistribution() {
        // 카테고리별 프로젝트 수를 DB에서 직접 집계
        List<Object[]> categoryStats = projectRepository.countByCategoryId();

        if (categoryStats.isEmpty()) {
            return Collections.emptyList();
        }

        // 총 프로젝트 수 계산
        long totalCount = categoryStats.stream()
                .mapToLong(row -> ((Number) row[1]).longValue())
                .sum();

        if (totalCount == 0) {
            return Collections.emptyList();
        }

        // 카테고리 ID별 색상 매핑
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

        final long finalTotalCount = totalCount;
        return categoryStats.stream()
                .map(row -> {
                    Integer categoryId = ((Number) row[0]).intValue();
                    Long count = ((Number) row[1]).longValue();
                    Double percent = (double) count / finalTotalCount * 100;

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
