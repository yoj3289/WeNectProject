package com.wenect.donation_paltform.domain.settlement.service;

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
import java.util.List;
import java.util.stream.Collectors;

/**
 * 정산 관리 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementManagementService {

    private final SettlementRepository settlementRepository;
    private final PiggyBankRepository piggyBankRepository;
    private final ProjectRepository projectRepository;
    private final RemoteFileStorageService fileStorageService;

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
            .accountNumber(requestDto.getAccountNumber()) // TODO: 암호화 처리
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

        // NOTE: 프로젝트 상태는 정산 승인 시에만 SETTLEMENT로 변경됨
        // 정산 요청 단계에서는 COMPLETED 상태를 유지

        return SettlementResponseDto.fromEntityWithProject(savedSettlement, project.getTitle());
    }

    /**
     * 정산 승인 (관리자)
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

        // 3. 저금통 조회 (이미 생성되어 있음)
        PiggyBank piggyBank = piggyBankRepository.findById(settlement.getPiggyId())
            .orElseThrow(() -> new IllegalArgumentException("저금통을 찾을 수 없습니다."));

        // 4. 저금통에 모금액 입금
        log.info("입금 전 저금통 상태 - piggyId: {}, projectId: {}, totalAmount: {}, balance: {}",
            piggyBank.getPiggyId(), piggyBank.getProjectId(), piggyBank.getTotalAmount(), piggyBank.getBalance());

        piggyBank.deposit(settlement.getSettlementAmount());

        log.info("입금 후 저금통 상태 - piggyId: {}, projectId: {}, totalAmount: {}, balance: {}",
            piggyBank.getPiggyId(), piggyBank.getProjectId(), piggyBank.getTotalAmount(), piggyBank.getBalance());

        PiggyBank savedPiggyBank = piggyBankRepository.save(piggyBank);

        log.info("저장 후 저금통 상태 - piggyId: {}, projectId: {}, totalAmount: {}, balance: {}",
            savedPiggyBank.getPiggyId(), savedPiggyBank.getProjectId(), savedPiggyBank.getTotalAmount(), savedPiggyBank.getBalance());

        // 5. 정산 승인 처리
        settlement.approve(piggyBank.getPiggyId(), approveDto.getAdminMemo());
        Settlement savedSettlement = settlementRepository.save(settlement);

        log.info("정산 승인 완료 - settlementId: {}, piggyId: {}, 입금액: {}",
            settlementId, piggyBank.getPiggyId(), settlement.getSettlementAmount());

        // 6. 프로젝트 정보 조회 및 상태 변경
        Project project = projectRepository.findById(settlement.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        // 7. 프로젝트 상태를 SETTLEMENT로 변경
        project.setStatus(Project.ProjectStatus.SETTLEMENT);
        projectRepository.save(project);

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

        // 5. 프로젝트 상태를 다시 COMPLETED로 변경 (재요청 가능하도록)
        Project project = projectRepository.findById(settlement.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        project.setStatus(Project.ProjectStatus.COMPLETED);
        projectRepository.save(project);

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
