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
 * 일반 사용자 기부 통계 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserStatisticsService {

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
     * 기부 트렌드 조회 (월별/연별)
     */
    public List<DonationTrendResponse> getDonationTrends(Long userId, String period, Integer year) {
        log.info("기부 트렌드 조회 - userId: {}, period: {}, year: {}", userId, period, year);

        // 사용자의 완료된 기부 내역 조회
        List<Donation> donations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        if ("yearly".equals(period)) {
            return getYearlyTrends(donations);
        } else {
            // monthly가 기본값
            return getMonthlyTrends(donations, year);
        }
    }

    /**
     * 월별 트렌드
     */
    private List<DonationTrendResponse> getMonthlyTrends(List<Donation> donations, Integer year) {
        // year가 지정되면 해당 연도만, 없으면 전체 데이터
        Map<String, List<Donation>> groupedByMonth = donations.stream()
                .filter(d -> year == null || d.getDonatedAt().getYear() == year)
                .collect(Collectors.groupingBy(d ->
                        d.getDonatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                ));

        return groupedByMonth.entrySet().stream()
                .map(entry -> {
                    String period = entry.getKey();
                    List<Donation> monthDonations = entry.getValue();
                    BigDecimal totalAmount = monthDonations.stream()
                            .map(Donation::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return DonationTrendResponse.builder()
                            .period(period)
                            .totalAmount(totalAmount)
                            .donationCount(monthDonations.size())
                            .build();
                })
                .sorted(Comparator.comparing(DonationTrendResponse::getPeriod).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 연별 트렌드
     */
    private List<DonationTrendResponse> getYearlyTrends(List<Donation> donations) {
        Map<String, List<Donation>> groupedByYear = donations.stream()
                .collect(Collectors.groupingBy(d ->
                        String.valueOf(d.getDonatedAt().getYear())
                ));

        return groupedByYear.entrySet().stream()
                .map(entry -> {
                    String period = entry.getKey();
                    List<Donation> yearDonations = entry.getValue();
                    BigDecimal totalAmount = yearDonations.stream()
                            .map(Donation::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return DonationTrendResponse.builder()
                            .period(period)
                            .totalAmount(totalAmount)
                            .donationCount(yearDonations.size())
                            .build();
                })
                .sorted(Comparator.comparing(DonationTrendResponse::getPeriod).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 카테고리 분석 조회
     */
    public List<CategoryAnalysisResponse> getCategoryAnalysis(Long userId) {
        log.info("카테고리 분석 조회 - userId: {}", userId);

        // 사용자의 완료된 기부 내역 조회
        List<Donation> completedDonations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        if (completedDonations.isEmpty()) {
            return Collections.emptyList();
        }

        // 프로젝트 ID로 프로젝트 정보 조회
        Set<Long> projectIds = completedDonations.stream()
                .map(Donation::getProjectId)
                .collect(Collectors.toSet());

        Map<Long, Project> projectMap = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getProjectId, p -> p));

        // 카테고리별로 그룹화
        Map<Integer, List<Donation>> groupedByCategory = completedDonations.stream()
                .filter(d -> projectMap.containsKey(d.getProjectId()))
                .collect(Collectors.groupingBy(d ->
                        projectMap.get(d.getProjectId()).getCategoryId()
                ));

        // 전체 기부액 계산
        BigDecimal totalAmount = completedDonations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 카테고리별 통계 생성
        return groupedByCategory.entrySet().stream()
                .map(entry -> {
                    Integer categoryId = entry.getKey();
                    List<Donation> categoryDonations = entry.getValue();
                    BigDecimal categoryAmount = categoryDonations.stream()
                            .map(Donation::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // 비율 계산
                    double percentage = totalAmount.compareTo(BigDecimal.ZERO) > 0
                            ? categoryAmount.divide(totalAmount, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue()
                            : 0.0;

                    return CategoryAnalysisResponse.builder()
                            .categoryId(categoryId)
                            .categoryName(getCategoryName(categoryId))
                            .totalAmount(categoryAmount)
                            .donationCount(categoryDonations.size())
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .build();
                })
                .sorted(Comparator.comparing(CategoryAnalysisResponse::getTotalAmount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 기부 타임라인 조회
     */
    public List<DonationTimelineResponse> getDonationTimeline(Long userId) {
        log.info("기부 타임라인 조회 - userId: {}", userId);

        // 사용자의 완료된 기부 내역 조회
        List<Donation> completedDonations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        if (completedDonations.isEmpty()) {
            return Collections.emptyList();
        }

        // 프로젝트 ID로 프로젝트 정보 조회
        Set<Long> projectIds = completedDonations.stream()
                .map(Donation::getProjectId)
                .collect(Collectors.toSet());

        Map<Long, Project> projectMap = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getProjectId, p -> p));

        // 타임라인 생성
        return completedDonations.stream()
                .filter(d -> projectMap.containsKey(d.getProjectId()))
                .map(d -> {
                    Project project = projectMap.get(d.getProjectId());
                    return DonationTimelineResponse.builder()
                            .donationId(d.getDonationId())
                            .donatedAt(d.getDonatedAt())
                            .amount(d.getAmount())
                            .projectTitle(project.getTitle())
                            .categoryId(project.getCategoryId())
                            .categoryName(getCategoryName(project.getCategoryId()))
                            .build();
                })
                .sorted(Comparator.comparing(DonationTimelineResponse::getDonatedAt).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 관심 카테고리 분포 조회
     * (카테고리별 기부한 프로젝트 수)
     */
    public List<FavoriteCategoryDistributionResponse> getFavoriteCategoryDistribution(Long userId) {
        log.info("관심 카테고리 분포 조회 - userId: {}", userId);

        // 사용자의 완료된 기부 내역 조회
        List<Donation> completedDonations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        if (completedDonations.isEmpty()) {
            return Collections.emptyList();
        }

        // 프로젝트 ID로 프로젝트 정보 조회
        Set<Long> projectIds = completedDonations.stream()
                .map(Donation::getProjectId)
                .collect(Collectors.toSet());

        Map<Long, Project> projectMap = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getProjectId, p -> p));

        // 카테고리별 고유 프로젝트 수 계산
        Map<Integer, Set<Long>> categoryProjectMap = new HashMap<>();
        completedDonations.stream()
                .filter(d -> projectMap.containsKey(d.getProjectId()))
                .forEach(d -> {
                    Integer categoryId = projectMap.get(d.getProjectId()).getCategoryId();
                    categoryProjectMap.computeIfAbsent(categoryId, k -> new HashSet<>())
                            .add(d.getProjectId());
                });

        // 전체 고유 프로젝트 수
        int totalProjectCount = projectIds.size();

        // 카테고리별 분포 생성
        return categoryProjectMap.entrySet().stream()
                .map(entry -> {
                    Integer categoryId = entry.getKey();
                    int projectCount = entry.getValue().size();

                    // 비율 계산
                    double percentage = totalProjectCount > 0
                            ? (projectCount * 100.0) / totalProjectCount
                            : 0.0;

                    return FavoriteCategoryDistributionResponse.builder()
                            .categoryId(categoryId)
                            .categoryName(getCategoryName(categoryId))
                            .projectCount(projectCount)
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .build();
                })
                .sorted(Comparator.comparing(FavoriteCategoryDistributionResponse::getProjectCount).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 카테고리 ID로 카테고리 이름 조회
     */
    private String getCategoryName(Integer categoryId) {
        return CATEGORY_NAMES.getOrDefault(categoryId, "기타");
    }
}
