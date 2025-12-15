package com.wenect.donation_paltform.domain.settlement.service;

import com.wenect.donation_paltform.domain.finance.entity.FinancialAuditLog;
import com.wenect.donation_paltform.domain.finance.entity.FinancialTransaction;
import com.wenect.donation_paltform.domain.finance.entity.PlatformLedger.LedgerCategory;
import com.wenect.donation_paltform.domain.finance.repository.FinancialAuditLogRepository;
import com.wenect.donation_paltform.domain.finance.repository.FinancialTransactionRepository;
import com.wenect.donation_paltform.domain.finance.service.LedgerService;
import com.wenect.donation_paltform.domain.finance.service.PlatformAccountService;
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.domain.piggybank.entity.PiggyBank;
import com.wenect.donation_paltform.domain.piggybank.repository.PiggyBankRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.settlement.dto.*;
import com.wenect.donation_paltform.domain.settlement.entity.Settlement;
import com.wenect.donation_paltform.domain.settlement.entity.SettlementDocument;
import com.wenect.donation_paltform.domain.settlement.repository.SettlementRepository;
import com.wenect.donation_paltform.global.service.RemoteFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 정산 관리 서비스
 *
 * 정산 프로세스 상태 전환:
 * - COMPLETED (모금 완료) → 정산 요청 가능
 * - PENDING (정산 대기) → 승인/반려 가능
 * - APPROVED (승인) → SETTLEMENT 상태로 전환, 저금통 입금
 * - REJECTED (반려) → COMPLETED로 복귀, 재요청 가능
 * - SETTLEMENT (정산 중) → 지출 후 결산 완료 가능
 * - CLOSED (종료) → 최종 상태
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementManagementService {

    private final SettlementRepository settlementRepository;
    private final PiggyBankRepository piggyBankRepository;
    private final ProjectRepository projectRepository;
    private final RemoteFileStorageService fileStorageService;
    private final SettlementEmailService settlementEmailService;
    private final com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository organizationRepository;
    private final NotificationService notificationService;

    // Finance 도메인 연동
    private final LedgerService ledgerService;
    private final PlatformAccountService platformAccountService;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final FinancialAuditLogRepository financialAuditLogRepository;

    // ==================== 상태 전환 중앙화 메서드 ====================

    /**
     * 프로젝트 상태를 SETTLEMENT로 전환 (정산 승인 시)
     */
    @Transactional
    public void transitionToSettlement(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        Project.ProjectStatus previousStatus = project.getStatus();

        // COMPLETED 상태에서만 SETTLEMENT로 전환 가능
        if (previousStatus != Project.ProjectStatus.COMPLETED) {
            log.warn("정산 상태 전환 시도 - 현재 상태: {} (projectId: {})", previousStatus, projectId);
            // COMPLETED가 아니어도 강제 전환 허용 (이미 승인 로직에서 검증됨)
        }

        project.setStatus(Project.ProjectStatus.SETTLEMENT);
        projectRepository.save(project);
        log.info("프로젝트 상태 전환: {} → SETTLEMENT (projectId: {})", previousStatus, projectId);
    }

    /**
     * 프로젝트 상태를 COMPLETED로 복귀 (정산 반려 시)
     */
    @Transactional
    public void transitionToCompleted(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // SETTLEMENT 또는 COMPLETED 상태에서만 COMPLETED로 복귀 가능
        if (project.getStatus() != Project.ProjectStatus.SETTLEMENT &&
            project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new IllegalStateException(
                String.format("상태 복귀 불가: 현재 상태 %s", project.getStatus()));
        }

        project.setStatus(Project.ProjectStatus.COMPLETED);
        projectRepository.save(project);
        log.info("프로젝트 상태 복귀: COMPLETED (projectId: {})", projectId);
    }

    /**
     * 프로젝트 상태를 CLOSED로 전환 (정산 승인 완료 시)
     * NOTE: 정산 승인 시 기관 계좌로 직접 송금 후 바로 CLOSED 상태로 전환
     */
    @Transactional
    public void transitionToClosed(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // COMPLETED 또는 SETTLEMENT 상태에서 CLOSED로 전환 가능
        if (project.getStatus() != Project.ProjectStatus.COMPLETED &&
            project.getStatus() != Project.ProjectStatus.SETTLEMENT) {
            throw new IllegalStateException(
                String.format("종료 전환 불가: 현재 상태 %s (COMPLETED 또는 SETTLEMENT 상태여야 함)", project.getStatus()));
        }

        Project.ProjectStatus previousStatus = project.getStatus();
        project.setStatus(Project.ProjectStatus.CLOSED);
        projectRepository.save(project);
        log.info("프로젝트 상태 전환: {} → CLOSED (projectId: {})", previousStatus, projectId);
    }

    /**
     * 프로젝트의 정산 가능 여부 확인
     */
    public boolean canRequestSettlement(Long projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return false;

        // COMPLETED 상태이고, 대기 중인 정산이 없어야 함
        if (project.getStatus() != Project.ProjectStatus.COMPLETED) return false;

        boolean hasPendingSettlement = settlementRepository.existsByProjectIdAndStatus(
            projectId, Settlement.SettlementStatus.PENDING);
        boolean hasApprovedSettlement = settlementRepository.existsByProjectIdAndStatus(
            projectId, Settlement.SettlementStatus.APPROVED) ||
            settlementRepository.existsByProjectIdAndStatus(
                projectId, Settlement.SettlementStatus.COMPLETED);

        return !hasPendingSettlement && !hasApprovedSettlement;
    }

    // ==================== 기존 서비스 메서드 ====================

    /**
     * 정산 요청 생성 (기관 사용자)
     */
    @Transactional
    public SettlementResponseDto createSettlementRequest(
        SettlementRequestDto requestDto,
        List<MultipartFile> documents
    ) throws IOException {
        // 1. 프로젝트 조회 및 검증
        Project project = projectRepository.findById(requestDto.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 2. 프로젝트 상태 검증 (COMPLETED 상태여야 함)
        if (project.getStatus() != Project.ProjectStatus.COMPLETED) {
            throw new IllegalStateException("완료된 프로젝트만 정산 요청이 가능합니다.");
        }

        // 3. 대기 중인 정산 요청이 있는지 확인
        if (settlementRepository.existsByProjectIdAndStatus(
            requestDto.getProjectId(),
            Settlement.SettlementStatus.PENDING
        )) {
            throw new IllegalStateException("이미 대기 중인 정산 요청이 있습니다.");
        }

        // 4. 이미 승인된 정산이 있는지 확인 (APPROVED 또는 COMPLETED 상태)
        boolean hasApprovedSettlement = settlementRepository.existsByProjectIdAndStatus(
            requestDto.getProjectId(),
            Settlement.SettlementStatus.APPROVED
        ) || settlementRepository.existsByProjectIdAndStatus(
            requestDto.getProjectId(),
            Settlement.SettlementStatus.COMPLETED
        );

        if (hasApprovedSettlement) {
            throw new IllegalStateException("이미 정산이 승인된 프로젝트입니다.");
        }

        // NOTE: REJECTED 상태인 경우 재요청 가능

        // 5. 저금통 조회 (모금 완료 시 자동 생성되어 있음)
        PiggyBank piggyBank = piggyBankRepository.findByProjectId(requestDto.getProjectId())
            .orElseThrow(() -> new IllegalStateException("저금통을 찾을 수 없습니다. 프로젝트가 완료되지 않았을 수 있습니다."));

        // 6. 정산 엔티티 생성
        Settlement settlement = Settlement.builder()
            .projectId(requestDto.getProjectId())
            .piggyId(piggyBank.getPiggyId()) // 저금통 ID 연결
            .settlementAmount(requestDto.getSettlementAmount())
            .bankName(requestDto.getBankName())
            .accountNumber(requestDto.getAccountNumber()) // JPA Converter로 자동 암호화
            .accountHolder(requestDto.getAccountHolder())
            .status(Settlement.SettlementStatus.PENDING)
            .build();

        // 7. 서류 첨부 처리
        if (documents != null && !documents.isEmpty()) {
            if (documents.size() > 10) {
                throw new IllegalArgumentException("서류는 최대 10개까지 첨부 가능합니다.");
            }

            for (MultipartFile file : documents) {
                // 파일 크기 검증 (10MB)
                if (file.getSize() > 10 * 1024 * 1024) {
                    throw new IllegalArgumentException("파일 크기는 10MB를 초과할 수 없습니다.");
                }

                // 파일 업로드
                String filePath = fileStorageService.saveFile(file);

                SettlementDocument document = SettlementDocument.builder()
                    .fileName(file.getOriginalFilename())
                    .filePath(filePath)
                    .fileSize(file.getSize())
                    .documentType(determineDocumentType(file.getOriginalFilename()))
                    .build();

                settlement.addDocument(document);
            }
        }

        // 8. 저장
        Settlement savedSettlement = settlementRepository.save(settlement);

        log.info("정산 요청 생성 완료 - settlementId: {}, projectId: {}",
            savedSettlement.getSettlementId(), requestDto.getProjectId());

        // 9. Organization 조회 및 정산 요청 접수 이메일 발송
        com.wenect.donation_paltform.domain.organization.entity.Organization organization =
            organizationRepository.findById(project.getOrgId())
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        settlementEmailService.sendSettlementRequestEmail(savedSettlement, organization, project.getTitle());

        // 10. 정산 요청 접수 알림 생성
        try {
            Long userId = organization.getUser().getUserId();
            notificationService.createSettlementRequestNotification(userId, project.getTitle(), savedSettlement.getSettlementId());
            log.info("정산 요청 접수 알림 생성 완료 - userId: {}, settlementId: {}", userId, savedSettlement.getSettlementId());
        } catch (Exception e) {
            log.error("정산 요청 접수 알림 생성 실패 - settlementId: {}", savedSettlement.getSettlementId(), e);
        }

        // NOTE: 프로젝트 상태는 정산 승인 시에만 SETTLEMENT로 변경됨
        // 정산 요청 단계에서는 COMPLETED 상태를 유지

        return SettlementResponseDto.fromEntityWithProject(savedSettlement, project.getTitle());
    }

    /**
     * 정산 승인 (관리자)
     * NOTE: 정산 승인 시 기관의 계좌로 직접 송금 처리 (저금통 X)
     */
    @Transactional
    public SettlementResponseDto approveSettlement(Long settlementId, SettlementApproveDto approveDto) {
        // 1. 정산 조회
        Settlement settlement = settlementRepository.findById(settlementId)
            .orElseThrow(() -> new IllegalArgumentException("정산을 찾을 수 없습니다."));

        // 2. 상태 검증
        if (settlement.getStatus() != Settlement.SettlementStatus.PENDING) {
            throw new IllegalStateException("대기 중인 정산만 승인 가능합니다.");
        }

        // 3. 프로젝트 정보 조회
        Project project = projectRepository.findById(settlement.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 4. 정산 승인 처리 (기관 계좌로 직접 송금 - 저금통 사용 X)
        settlement.approve(settlement.getPiggyId(), approveDto.getAdminMemo());
        Settlement savedSettlement = settlementRepository.save(settlement);

        log.info("정산 승인 완료 - settlementId: {}, 정산금액: {}, 은행: {}, 예금주: {}",
            settlementId, settlement.getSettlementAmount(),
            settlement.getBankName(), settlement.getAccountHolder());

        // 5. Finance 도메인 연동: 플랫폼 원장에 기관 계좌 송금 기록
        recordFinanceForSettlement(savedSettlement, project.getOrgId());

        // 6. 프로젝트 상태를 CLOSED로 변경 (정산 완료 = 프로젝트 종료)
        transitionToClosed(settlement.getProjectId());

        // 7. Organization 조회 및 정산 승인 완료 이메일 발송
        com.wenect.donation_paltform.domain.organization.entity.Organization organization =
            organizationRepository.findById(project.getOrgId())
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        settlementEmailService.sendSettlementApprovalEmail(savedSettlement, organization, project.getTitle());

        // 8. 정산 승인 알림 생성
        try {
            Long userId = organization.getUser().getUserId();
            notificationService.createSettlementApprovalNotification(userId, project.getTitle(), savedSettlement.getSettlementId());
            log.info("정산 승인 알림 생성 완료 - userId: {}, settlementId: {}", userId, savedSettlement.getSettlementId());
        } catch (Exception e) {
            log.error("정산 승인 알림 생성 실패 - settlementId: {}", savedSettlement.getSettlementId(), e);
        }

        return SettlementResponseDto.fromEntityWithProject(savedSettlement, project.getTitle());
    }

    /**
     * 정산 반려 (관리자)
     */
    @Transactional
    public SettlementResponseDto rejectSettlement(Long settlementId, SettlementRejectDto rejectDto) {
        // 1. 정산 조회
        Settlement settlement = settlementRepository.findById(settlementId)
            .orElseThrow(() -> new IllegalArgumentException("정산을 찾을 수 없습니다."));

        // 2. 상태 검증
        if (settlement.getStatus() != Settlement.SettlementStatus.PENDING) {
            throw new IllegalStateException("대기 중인 정산만 반려 가능합니다.");
        }

        // 3. 반려 사유 검증
        if (rejectDto.getRejectionReason() == null || rejectDto.getRejectionReason().trim().isEmpty()) {
            throw new IllegalArgumentException("반려 사유를 입력해주세요.");
        }

        // 4. 정산 반려 처리
        settlement.reject(rejectDto.getRejectionReason());
        Settlement savedSettlement = settlementRepository.save(settlement);

        log.info("정산 반려 완료 - settlementId: {}, reason: {}",
            settlementId, rejectDto.getRejectionReason());

        // 5. 프로젝트 상태를 다시 COMPLETED로 변경 (중앙화된 메서드 사용)
        transitionToCompleted(settlement.getProjectId());

        // 6. 프로젝트 정보 조회
        Project project = projectRepository.findById(settlement.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 7. Organization 조회 및 정산 반려 이메일 발송
        com.wenect.donation_paltform.domain.organization.entity.Organization organization =
            organizationRepository.findById(project.getOrgId())
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));
        settlementEmailService.sendSettlementRejectionEmail(savedSettlement, organization, project.getTitle());

        // 8. 정산 반려 알림 생성
        try {
            Long userId = organization.getUser().getUserId();
            notificationService.createSettlementRejectionNotification(
                userId, project.getTitle(), savedSettlement.getSettlementId(), rejectDto.getRejectionReason());
            log.info("정산 반려 알림 생성 완료 - userId: {}, settlementId: {}", userId, savedSettlement.getSettlementId());
        } catch (Exception e) {
            log.error("정산 반려 알림 생성 실패 - settlementId: {}", savedSettlement.getSettlementId(), e);
        }

        return SettlementResponseDto.fromEntityWithProject(savedSettlement, project.getTitle());
    }

    /**
     * 정산 상세 조회
     */
    @Transactional(readOnly = true)
    public SettlementResponseDto getSettlement(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
            .orElseThrow(() -> new IllegalArgumentException("정산을 찾을 수 없습니다."));

        Project project = projectRepository.findById(settlement.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        return SettlementResponseDto.fromEntityWithProject(settlement, project.getTitle());
    }

    /**
     * 프로젝트별 정산 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SettlementResponseDto> getSettlementsByProject(Long projectId) {
        List<Settlement> settlements = settlementRepository.findByProjectIdOrderByRequestedAtDesc(projectId);

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        return settlements.stream()
            .map(s -> SettlementResponseDto.fromEntityWithProject(s, project.getTitle()))
            .collect(Collectors.toList());
    }

    /**
     * 상태별 정산 목록 조회 (관리자)
     */
    @Transactional(readOnly = true)
    public List<SettlementResponseDto> getSettlementsByStatus(String status) {
        Settlement.SettlementStatus settlementStatus = Settlement.SettlementStatus.valueOf(status.toUpperCase());
        List<Settlement> settlements = settlementRepository.findByStatusOrderByRequestedAtDesc(settlementStatus);

        return settlements.stream()
            .map(s -> {
                Project project = projectRepository.findById(s.getProjectId()).orElse(null);
                String projectTitle = project != null ? project.getTitle() : "Unknown";
                return SettlementResponseDto.fromEntityWithProject(s, projectTitle);
            })
            .collect(Collectors.toList());
    }

    /**
     * 대기 중인 정산 개수 조회 (관리자 대시보드용)
     */
    @Transactional(readOnly = true)
    public Long getPendingSettlementCount() {
        return settlementRepository.countByStatus(Settlement.SettlementStatus.PENDING);
    }

    // ==================== Finance 도메인 연동 메서드 ====================

    /**
     * 정산 승인 시 Finance 도메인에 기록
     * - 플랫폼 원장에 출금 기록 (기관 정산)
     * - 거래 내역 기록
     * - 감사 로그 기록
     * NOTE: 위넥트 플랫폼은 수수료를 받지 않음
     */
    private void recordFinanceForSettlement(Settlement settlement, Long organizationId) {
        try {
            Long platformAccountId = platformAccountService.getPrimaryAccountId();
            BigDecimal settlementAmount = settlement.getSettlementAmount();

            // NOTE: 위넥트 플랫폼은 수수료가 없음 - 전액 기관에 지급
            BigDecimal netAmount = settlementAmount;

            // 1. 원장에 기관 정산 출금 기록 (기관 계좌로 직접 송금)
            ledgerService.recordWithdrawal(
                platformAccountId,
                LedgerCategory.ORG_SETTLEMENT,
                netAmount,
                "Settlement",
                settlement.getSettlementId(),
                String.format("기관 정산 출금 - 프로젝트 ID: %d, 은행: %s, 계좌: %s",
                    settlement.getProjectId(), settlement.getBankName(), settlement.getAccountHolder()),
                settlement.getProjectId(),
                organizationId,
                null,
                "SYSTEM"
            );

            // 2. 거래 내역 기록 (기관 계좌로 직접 송금)
            FinancialTransaction transaction = FinancialTransaction.builder()
                .transactionCode(FinancialTransaction.generateTransactionCode(
                    FinancialTransaction.TransactionType.ORG_SETTLEMENT))
                .transactionType(FinancialTransaction.TransactionType.ORG_SETTLEMENT)
                .amount(settlementAmount)
                .feeAmount(BigDecimal.ZERO)  // 수수료 없음
                .netAmount(netAmount)
                .fromAccountType(FinancialTransaction.AccountType.PLATFORM)
                .fromAccountId(platformAccountId)
                .toAccountType(FinancialTransaction.AccountType.ORGANIZATION)  // 기관 계좌로 직접 송금
                .toAccountId(organizationId)
                .projectId(settlement.getProjectId())
                .organizationId(organizationId)
                .settlementId(settlement.getSettlementId())
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .description(String.format("기관 정산 - %s %s", settlement.getBankName(), settlement.getAccountHolder()))
                .performedByType("SYSTEM")
                .build();
            transaction.complete();
            financialTransactionRepository.save(transaction);

            // 3. 감사 로그 기록
            FinancialAuditLog auditLog = FinancialAuditLog.builder()
                .action(FinancialAuditLog.AuditAction.APPROVE)
                .entityType("Settlement")
                .entityId(settlement.getSettlementId())
                .performedBy(0L) // 시스템
                .performedByRole(FinancialAuditLog.PerformerRole.SYSTEM)
                .projectId(settlement.getProjectId())
                .organizationId(organizationId)
                .description(String.format("기관 정산 승인 - 금액: %s (수수료 없음), 은행: %s, 예금주: %s",
                    settlementAmount, settlement.getBankName(), settlement.getAccountHolder()))
                .build();
            financialAuditLogRepository.save(auditLog);

            log.info("Finance 기록 완료 - settlementId: {}, amount: {} (수수료 없음, 기관 계좌로 직접 송금)",
                settlement.getSettlementId(), settlementAmount);

        } catch (Exception e) {
            // Finance 기록 실패해도 정산 승인은 진행 (로그만 남김)
            log.error("Finance 기록 실패 - settlementId: {}", settlement.getSettlementId(), e);
        }
    }

    /**
     * 파일 확장자로 서류 타입 결정
     */
    private SettlementDocument.DocumentType determineDocumentType(String filename) {
        if (filename == null) return SettlementDocument.DocumentType.OTHER;

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        String lowerName = filename.toLowerCase();

        // 파일명 기반 판단
        if (lowerName.contains("통장") || lowerName.contains("account") || lowerName.contains("copy")) {
            return SettlementDocument.DocumentType.ACCOUNT_COPY;
        }
        if (lowerName.contains("보고서") || lowerName.contains("report") || lowerName.contains("usage")) {
            return SettlementDocument.DocumentType.USAGE_REPORT;
        }
        if (lowerName.contains("영수증") || lowerName.contains("invoice") || lowerName.contains("receipt")) {
            return SettlementDocument.DocumentType.INVOICE;
        }

        // 기본값: OTHER
        return SettlementDocument.DocumentType.OTHER;
    }
}
