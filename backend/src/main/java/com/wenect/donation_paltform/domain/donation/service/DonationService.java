package com.wenect.donation_paltform.domain.donation.service;

import com.wenect.donation_paltform.domain.donation.dto.DonationRequest;
import com.wenect.donation_paltform.domain.donation.dto.DonationResponse;
import com.wenect.donation_paltform.domain.donation.dto.FeaturedMessageResponse;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import com.wenect.donation_paltform.domain.piggybank.repository.PiggyBankRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private static final int MAX_FEATURED_COUNT = 10;

    private final DonationRepository donationRepository;

    /**
     * 사용자 기부 통계 DTO
     */
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class UserDonationStats {
        private BigDecimal totalAmount;      // 총 기부금액
        private int totalCount;               // 총 기부횟수
        private int completedCount;           // 완료된 기부횟수
    }

    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final PiggyBankRepository piggyBankRepository;

    /**
     * 기부 내역 생성 (결제 준비 단계)
     */
    @Transactional
    public Donation createDonation(DonationRequest request, Long userId) {
        // 프로젝트 존재 여부 확인
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 주문 ID 생성 (UUID 기반)
        String orderId = "ORDER_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);

        // 회원 전용 시스템: userId 필수
        if (userId == null) {
            throw new IllegalStateException("회원만 기부가 가능합니다.");
        }
        log.info("기부 내역 생성 - userId: {}, orderId: {}", userId, orderId);

        // 기부 내역 생성
        Donation donation = Donation.builder()
                .projectId(request.getProjectId())
                .userId(userId)
                .selectedOptionId(request.getSelectedOptionId())  // 선택한 기부 옵션 ID
                .donorName(request.getDonorName())
                .donorEmail(request.getDonorEmail())
                .donorPhone(request.getDonorPhone())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(Donation.DonationStatus.PENDING)
                .orderId(orderId)
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .message(request.getMessage())
                .build();

        return donationRepository.save(donation);
    }

    /**
     * 결제 승인 처리
     */
    @Transactional
    public void approveDonation(String orderId, String tid, String aid, String paymentMethodType) {
        log.info("기부 승인 처리 - orderId: {}, tid: {}", orderId, tid);

        // 기부 내역 조회
        Donation donation = donationRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("기부 내역을 찾을 수 없습니다."));

        // 프로젝트 정보 조회 (알림에 사용)
        Project project = projectRepository.findById(donation.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 기부 내역 업데이트
        donation.setStatus(Donation.DonationStatus.COMPLETED);
        donation.setPaymentTid(tid);
        donation.setPaymentAid(aid);
        donation.setPaymentMethodType(paymentMethodType);
        donation.setApprovedAt(LocalDateTime.now());
        donationRepository.save(donation);

        // 프로젝트 모금액 및 기부자 수 업데이트
        // 첫 기부 여부 체크 (중복 카운트 방지)
        boolean isFirstDonation = isFirstDonationToProject(donation);
        updateProjectDonationStats(donation.getProjectId(), donation.getAmount(), isFirstDonation);

        // 기부 완료 알림 생성 (기부자에게)
        try {
            notificationService.createDonationNotification(
                    donation.getUserId(),
                    project.getTitle(),
                    project.getProjectId(),
                    donation.getAmount().longValue()
            );
            log.info("기부 완료 알림 생성 - userId: {}, projectId: {}",
                    donation.getUserId(), project.getProjectId());
        } catch (Exception e) {
            // 알림 생성 실패는 기부 승인 프로세스에 영향을 주지 않음
            log.error("알림 생성 실패 - userId: {}, projectId: {}",
                    donation.getUserId(), project.getProjectId(), e);
        }

        log.info("기부 승인 완료 - donationId: {}, amount: {}", donation.getDonationId(), donation.getAmount());
    }

    /**
     * 결제 취소 처리
     */
    @Transactional
    public void cancelDonation(String orderId) {
        Donation donation = donationRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("기부 내역을 찾을 수 없습니다."));

        donation.setStatus(Donation.DonationStatus.CANCELLED);
        donationRepository.save(donation);

        log.info("기부 취소 처리 완료 - orderId: {}", orderId);
    }

    /**
     * 결제 실패 처리
     */
    @Transactional
    public void failDonation(String orderId) {
        Donation donation = donationRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("기부 내역을 찾을 수 없습니다."));

        donation.setStatus(Donation.DonationStatus.FAILED);
        donationRepository.save(donation);

        log.info("기부 실패 처리 완료 - orderId: {}", orderId);
    }

    /**
     * 해당 프로젝트에 대한 첫 기부인지 확인 (기부자 수 중복 카운트 방지)
     * 회원 전용 시스템이므로 userId 기준으로만 체크
     */
    private boolean isFirstDonationToProject(Donation donation) {
        Long projectId = donation.getProjectId();
        Long userId = donation.getUserId();

        if (userId == null) {
            // 회원 전용 시스템이므로 userId가 없으면 예외 발생
            throw new IllegalStateException("회원만 기부가 가능합니다.");
        }

        return !donationRepository.existsByProjectIdAndUserIdAndStatus(
                projectId, userId, Donation.DonationStatus.COMPLETED);
    }

    /**
     * 프로젝트의 모금액 및 기부자 수 업데이트
     * @param isFirstDonation 해당 프로젝트에 대한 첫 기부인지 여부
     */
    @Transactional
    public void updateProjectDonationStats(Long projectId, BigDecimal amount, boolean isFirstDonation) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 현재 모금액 업데이트
        BigDecimal newAmount = project.getCurrentAmount().add(amount);
        project.setCurrentAmount(newAmount);

        // 첫 기부인 경우에만 기부자 수 증가 (중복 카운트 방지)
        if (isFirstDonation) {
            project.setDonorCount(project.getDonorCount() + 1);
            log.info("새 기부자 카운트 - projectId: {}, donorCount: {}", projectId, project.getDonorCount());
        } else {
            log.info("기존 기부자의 추가 기부 - projectId: {}, donorCount 유지: {}", projectId, project.getDonorCount());
        }

        projectRepository.save(project);

        log.info("프로젝트 통계 업데이트 완료 - projectId: {}, currentAmount: {}, donorCount: {}",
                projectId, newAmount, project.getDonorCount());

        // 모금액이 목표 금액의 100% 이상 달성 시 프로젝트 완료 처리
        if (newAmount.compareTo(project.getTargetAmount()) >= 0 &&
            project.getStatus() == Project.ProjectStatus.ACTIVE) {

            project.setStatus(Project.ProjectStatus.COMPLETED);
            projectRepository.save(project);

            // 저금통 자동 생성 (초기 금액 0)
            boolean piggyBankExists = piggyBankRepository.findByProjectId(projectId).isPresent();
            if (!piggyBankExists) {
                PiggyBank piggyBank = PiggyBank.builder()
                        .projectId(projectId)
                        .totalAmount(BigDecimal.ZERO)
                        .withdrawnAmount(BigDecimal.ZERO)
                        .balance(BigDecimal.ZERO)
                        .status(PiggyBank.PiggyBankStatus.ACTIVE)
                        .build();
                piggyBankRepository.save(piggyBank);

                log.info("모금액 100% 달성으로 프로젝트 완료 처리 및 저금통 생성 - projectId: {}, currentAmount: {}, targetAmount: {}, piggyId: {}",
                        projectId, newAmount, project.getTargetAmount(), piggyBank.getPiggyId());
            } else {
                log.info("모금액 100% 달성으로 프로젝트 완료 처리 - projectId: {}, currentAmount: {}, targetAmount: {} (저금통 이미 존재)",
                        projectId, newAmount, project.getTargetAmount());
            }

            // 프로젝트 소유자에게 목표 달성 알림 생성
            try {
                notificationService.createGoalAchievedNotification(
                        project.getOrgId(),
                        project.getTitle(),
                        project.getProjectId()
                );
                log.info("목표 달성 알림 생성 - orgId: {}, projectId: {}",
                        project.getOrgId(), project.getProjectId());
            } catch (Exception e) {
                log.error("목표 달성 알림 생성 실패", e);
            }

            // 해당 프로젝트에 기부한 모든 기부자에게 목표 달성 알림 생성
            try {
                sendGoalAchievedNotificationToDonors(project);
            } catch (Exception e) {
                log.error("기부자 목표 달성 알림 생성 실패", e);
            }
        }
    }

    /**
     * 프로젝트 목표 달성 시 모든 기부자에게 알림 전송
     */
    private void sendGoalAchievedNotificationToDonors(Project project) {
        // 해당 프로젝트의 완료된 기부 내역 조회
        List<Donation> completedDonations = donationRepository.findByProjectIdOrderByCreatedAtDesc(project.getProjectId())
                .stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        // 중복 제거를 위해 userId 기준으로 Set 사용
        java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();

        for (Donation donation : completedDonations) {
            Long userId = donation.getUserId();
            // userId가 null이 아니고, 아직 알림을 보내지 않은 사용자이고, 프로젝트 소유자가 아닌 경우
            if (userId != null && !notifiedUserIds.contains(userId) && !userId.equals(project.getOrgId())) {
                try {
                    notificationService.createNotification(
                            userId,
                            "goal_achieved",
                            "project",
                            "후원하신 프로젝트가 목표를 달성했습니다!",
                            String.format("회원님이 후원하신 '%s' 프로젝트가 목표 금액 100%%를 달성했습니다! 감사합니다.",
                                    project.getTitle()),
                            "/projects/" + project.getProjectId(),
                            java.util.Map.of(
                                    "projectId", project.getProjectId().toString(),
                                    "projectTitle", project.getTitle()
                            )
                    );
                    notifiedUserIds.add(userId);
                } catch (Exception e) {
                    log.error("기부자 목표 달성 알림 생성 실패 - userId: {}", userId, e);
                }
            }
        }

        log.info("프로젝트 목표 달성 기부자 알림 전송 완료 - projectId: {}, 알림 전송 수: {}",
                project.getProjectId(), notifiedUserIds.size());
    }

    /**
     * 주문 ID로 기부 내역 조회
     */
    @Transactional(readOnly = true)
    public Donation getDonationByOrderId(String orderId) {
        return donationRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("기부 내역을 찾을 수 없습니다."));
    }

    /**
     * 프로젝트별 기부 내역 목록 조회 (완료된 기부만)
     */
    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationsByProjectId(Long projectId) {
        List<Donation> donations = donationRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        // COMPLETED 상태의 기부만 반환 (통계 일치를 위해)
        return donations.stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .map(DonationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 사용자별 기부 내역 목록 조회
     */
    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationsByUserId(Long userId) {
        List<Donation> donations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return donations.stream()
                .map(DonationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 사용자 기부 통계 조회
     * 총 기부금액, 총 기부횟수, 완료된 기부횟수
     */
    @Transactional(readOnly = true)
    public UserDonationStats getUserDonationStats(Long userId) {
        List<Donation> donations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // 완료된 기부만 필터링
        List<Donation> completedDonations = donations.stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        // 총 기부금액 (완료된 기부만)
        BigDecimal totalAmount = completedDonations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new UserDonationStats(totalAmount, donations.size(), completedDonations.size());
    }

    /**
     * 사용자별 기부 내역 페이지네이션 조회 (필터 지원)
     *
     * @param userId 사용자 ID
     * @param year 연도 필터 (null이면 전체)
     * @param status 상태 필터 (null이면 전체)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     */
    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getDonationsByUserIdPaged(
            Long userId, Integer year, String status, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Donation> donationPage;

        // 상태 변환
        Donation.DonationStatus donationStatus = null;
        if (status != null && !status.isEmpty() && !status.equals("all")) {
            try {
                donationStatus = Donation.DonationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid donation status: {}", status);
            }
        }

        // 조건에 따른 쿼리 분기
        if (year != null && donationStatus != null) {
            donationPage = donationRepository.findByUserIdAndYearAndStatus(userId, year, donationStatus, pageable);
        } else if (year != null) {
            donationPage = donationRepository.findByUserIdAndYear(userId, year, pageable);
        } else if (donationStatus != null) {
            donationPage = donationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, donationStatus, pageable);
        } else {
            donationPage = donationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<DonationResponse> content = donationPage.getContent().stream()
                .map(donation -> {
                    // 프로젝트 정보 조회
                    String projectTitle = "프로젝트명 없음";
                    String organizationName = null;
                    if (donation.getProjectId() != null) {
                        Project project = projectRepository.findById(donation.getProjectId()).orElse(null);
                        if (project != null) {
                            projectTitle = project.getTitle();
                        }
                    }
                    return DonationResponse.from(donation, projectTitle, organizationName);
                })
                .collect(Collectors.toList());

        return PageResponse.<DonationResponse>builder()
                .content(content)
                .currentPage(donationPage.getNumber())
                .totalPages(donationPage.getTotalPages())
                .totalElements(donationPage.getTotalElements())
                .size(donationPage.getSize())
                .build();
    }

    /**
     * 최근 기부 내역 조회 (완료된 기부만, 일주일 이내)
     */
    @Transactional(readOnly = true)
    public List<DonationResponse> getRecentDonations(int limit) {
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        Pageable pageable = PageRequest.of(0, limit);
        List<Donation> donations = donationRepository.findByStatusAndDonatedAtAfterOrderByDonatedAtDesc(
                Donation.DonationStatus.COMPLETED, oneWeekAgo, pageable);
        return donations.stream()
                .map(DonationResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 기부 내역 저장
     */
    @Transactional
    public Donation saveDonation(Donation donation) {
        return donationRepository.save(donation);
    }

    /**
     * 프로젝트 통계 재계산 (데이터 불일치 해결용)
     * 완료된 기부 내역을 기준으로 프로젝트의 currentAmount와 donorCount를 재계산
     * donorCount는 고유 기부자 수로 계산 (회원: userId, 비회원: donorEmail)
     */
    @Transactional
    public void recalculateProjectStats(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 완료된 기부 내역만 조회
        List<Donation> completedDonations = donationRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED)
                .collect(Collectors.toList());

        // 총 기부액 계산
        BigDecimal totalAmount = completedDonations.stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 고유 기부자 수 계산 (회원 전용 시스템: userId 기준)
        java.util.Set<Long> uniqueDonors = new java.util.HashSet<>();
        for (Donation donation : completedDonations) {
            if (donation.getUserId() != null) {
                uniqueDonors.add(donation.getUserId());
            }
        }
        int donorCount = uniqueDonors.size();

        // 프로젝트 업데이트
        project.setCurrentAmount(totalAmount);
        project.setDonorCount(donorCount);
        projectRepository.save(project);

        log.info("프로젝트 통계 재계산 완료 - projectId: {}, currentAmount: {}, donorCount: {} (총 기부 횟수: {})",
                projectId, totalAmount, donorCount, completedDonations.size());
    }

    // ==================== Featured Messages (홈페이지 노출용) ====================

    /**
     * 홈페이지에 노출할 Featured 응원 메시지 목록 조회
     * 관리자가 선정한 메시지만 표시 (최대 10개)
     *
     * @param limit 최대 노출 개수
     */
    @Transactional(readOnly = true)
    public List<FeaturedMessageResponse> getFeaturedMessages(int limit) {
        Pageable pageable = PageRequest.of(0, limit);

        // 관리자가 선정한 Featured 메시지만 조회
        List<Donation> featuredDonations = donationRepository.findFeaturedDonations(pageable);

        // DTO로 변환 (프로젝트 제목 조회 포함)
        return featuredDonations.stream()
                .map(donation -> {
                    String projectTitle = "프로젝트명 없음";
                    if (donation.getProjectId() != null) {
                        projectTitle = projectRepository.findById(donation.getProjectId())
                                .map(Project::getTitle)
                                .orElse("프로젝트명 없음");
                    }
                    return FeaturedMessageResponse.from(donation, projectTitle);
                })
                .collect(Collectors.toList());
    }

    /**
     * 기부 메시지의 Featured 상태 토글 (관리자용)
     *
     * @param donationId 기부 ID
     * @param isFeatured Featured 상태
     */
    @Transactional
    public void toggleFeatured(Long donationId, boolean isFeatured) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("기부 내역을 찾을 수 없습니다."));

        // 메시지가 없는 기부는 Featured로 설정 불가
        if (isFeatured && (donation.getMessage() == null || donation.getMessage().isBlank())) {
            throw new IllegalArgumentException("응원 메시지가 없는 기부는 홈에 노출할 수 없습니다.");
        }

        // Featured 추가 시 개수 제한 체크
        if (isFeatured && !donation.getIsFeatured()) {
            long currentCount = donationRepository.countFeaturedDonations();
            if (currentCount >= MAX_FEATURED_COUNT) {
                throw new IllegalArgumentException("홈페이지 노출은 최대 " + MAX_FEATURED_COUNT + "개까지만 가능합니다.");
            }
        }

        donation.setIsFeatured(isFeatured);
        donationRepository.save(donation);

        log.info("기부 Featured 상태 변경 - donationId: {}, isFeatured: {}", donationId, isFeatured);
    }

    // ==================== 관리자용 전체 기부 조회 ====================

    /**
     * 관리자용 전체 기부 내역 조회 (필터 지원)
     *
     * @param status 상태 필터 (null이면 전체)
     * @param hasMessage 메시지 유무 필터 (null이면 전체)
     * @param isFeatured Featured 필터 (null이면 전체)
     * @param period 기간 필터 (week, month, all)
     * @param page 페이지 번호
     * @param size 페이지 크기
     */
    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getAllDonationsForAdmin(
            String status, Boolean hasMessage, Boolean isFeatured, String period, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Donation> donationPage;

        // 상태 변환
        Donation.DonationStatus donationStatus = null;
        if (status != null && !status.isEmpty() && !status.equals("all")) {
            try {
                donationStatus = Donation.DonationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid donation status: {}", status);
            }
        }

        // 기간 계산
        LocalDateTime startDate = null;
        if (period != null) {
            switch (period) {
                case "week":
                    startDate = LocalDateTime.now().minusWeeks(1);
                    break;
                case "month":
                    startDate = LocalDateTime.now().minusMonths(1);
                    break;
                case "3months":
                    startDate = LocalDateTime.now().minusMonths(3);
                    break;
                // "all"이거나 null이면 startDate = null (전체 조회)
            }
        }

        // Featured 필터가 있는 경우
        if (isFeatured != null) {
            donationPage = donationRepository.findByIsFeatured(isFeatured, pageable);
        }
        // 메시지 필터가 있는 경우
        else if (hasMessage != null && hasMessage) {
            if (donationStatus != null) {
                donationPage = donationRepository.findWithMessageAndStatus(donationStatus, pageable);
            } else {
                donationPage = donationRepository.findAllWithMessage(pageable);
            }
        }
        // 기간 + 상태 필터
        else if (startDate != null && donationStatus != null) {
            donationPage = donationRepository.findByCreatedAtAfterAndStatus(startDate, donationStatus, pageable);
        }
        // 기간 필터만
        else if (startDate != null) {
            donationPage = donationRepository.findByCreatedAtAfter(startDate, pageable);
        }
        // 상태 필터만
        else if (donationStatus != null) {
            donationPage = donationRepository.findByStatus(donationStatus, pageable);
        }
        // 필터 없음 - 전체 조회
        else {
            donationPage = donationRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<DonationResponse> content = donationPage.getContent().stream()
                .map(donation -> {
                    String projectTitle = "프로젝트명 없음";
                    if (donation.getProjectId() != null) {
                        Project project = projectRepository.findById(donation.getProjectId()).orElse(null);
                        if (project != null) {
                            projectTitle = project.getTitle();
                        }
                    }
                    return DonationResponse.from(donation, projectTitle, null);
                })
                .collect(Collectors.toList());

        return PageResponse.<DonationResponse>builder()
                .content(content)
                .currentPage(donationPage.getNumber())
                .totalPages(donationPage.getTotalPages())
                .totalElements(donationPage.getTotalElements())
                .size(donationPage.getSize())
                .build();
    }

    /**
     * 100% 달성 프로젝트 일괄 완료 처리 (임시 마이그레이션용 - 사용 후 삭제)
     */
    @Transactional
    public com.wenect.donation_paltform.domain.donation.controller.DonationController.MigrationResult migrateFundedProjects() {
        List<Project> activeProjects = projectRepository.findByStatus(Project.ProjectStatus.ACTIVE);
        List<Long> completedProjectIds = new java.util.ArrayList<>();
        int completedCount = 0;
        int piggyBankCreatedCount = 0;

        for (Project project : activeProjects) {
            // 100% 이상 달성한 프로젝트 찾기
            if (project.getCurrentAmount().compareTo(project.getTargetAmount()) >= 0) {
                // 프로젝트 상태 변경
                project.setStatus(Project.ProjectStatus.COMPLETED);
                projectRepository.save(project);
                completedProjectIds.add(project.getProjectId());
                completedCount++;

                // 저금통 생성 (중복 체크)
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
                    piggyBankCreatedCount++;

                    log.info("프로젝트 완료 처리 및 저금통 생성 - projectId: {}, title: {}, currentAmount: {}, targetAmount: {}, piggyId: {}",
                            project.getProjectId(), project.getTitle(),
                            project.getCurrentAmount(), project.getTargetAmount(),
                            piggyBank.getPiggyId());
                } else {
                    log.info("프로젝트 완료 처리 - projectId: {}, title: {}, currentAmount: {}, targetAmount: {} (저금통 이미 존재)",
                            project.getProjectId(), project.getTitle(),
                            project.getCurrentAmount(), project.getTargetAmount());
                }
            }
        }

        log.info("완료 처리: {}개, 저금통 생성: {}개", completedCount, piggyBankCreatedCount);
        return new com.wenect.donation_paltform.domain.donation.controller.DonationController.MigrationResult(
                completedCount,
                piggyBankCreatedCount,
                completedProjectIds
        );
    }
}
