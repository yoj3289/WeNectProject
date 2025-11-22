package com.wenect.donation_paltform.domain.donation.service;

import com.wenect.donation_paltform.domain.donation.dto.DonationRequest;
import com.wenect.donation_paltform.domain.donation.dto.DonationResponse;
import com.wenect.donation_paltform.domain.donation.entity.Donation;
import com.wenect.donation_paltform.domain.donation.repository.DonationRepository;
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import com.wenect.donation_paltform.domain.piggybank.repository.PiggyBankRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final DonationRepository donationRepository;
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

        // 비회원 기부의 경우 userId는 null로 유지 (Donation 엔티티가 nullable 허용)
        log.info("기부 내역 생성 - userId: {}, orderId: {}", userId, orderId);

        // 기부 내역 생성
        Donation donation = Donation.builder()
                .projectId(request.getProjectId())
                .userId(userId)  // 비회원은 null 허용
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
        updateProjectDonationStats(donation.getProjectId(), donation.getAmount());

        // 회원 기부인 경우 알림 생성 (비회원은 userId가 null)
        if (donation.getUserId() != null) {
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
     * 프로젝트의 모금액 및 기부자 수 업데이트
     */
    @Transactional
    public void updateProjectDonationStats(Long projectId, BigDecimal amount) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 현재 모금액 업데이트
        BigDecimal newAmount = project.getCurrentAmount().add(amount);
        project.setCurrentAmount(newAmount);

        // 기부자 수 증가
        project.setDonorCount(project.getDonorCount() + 1);

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
        }
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
     * 최근 기부 내역 조회 (완료된 기부만)
     */
    @Transactional(readOnly = true)
    public List<DonationResponse> getRecentDonations(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Donation> donations = donationRepository.findByStatusOrderByCreatedAtDesc(
                Donation.DonationStatus.COMPLETED, pageable);
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

        // 기부자 수 계산
        int donorCount = completedDonations.size();

        // 프로젝트 업데이트
        project.setCurrentAmount(totalAmount);
        project.setDonorCount(donorCount);
        projectRepository.save(project);

        log.info("프로젝트 통계 재계산 완료 - projectId: {}, currentAmount: {}, donorCount: {}",
                projectId, totalAmount, donorCount);
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
