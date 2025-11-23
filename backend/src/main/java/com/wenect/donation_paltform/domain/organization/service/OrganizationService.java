package com.wenect.donation_paltform.domain.organization.service;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.organization.dto.OrganizationStatsResponse;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationDocumentRepository;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

/**
 * 기관 관리 서비스
 * - 기관 대시보드 통계 및 프로젝트 관리 기능 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationDocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.wenect.donation_paltform.global.service.RemoteFileStorageService fileStorageService;

    /**
     * 기관 통계 조회
     * - 전체/진행 중/결산 중/종료 프로젝트 수
     * - 총 모금액, 진행 중 모금액, 저금통 잔액
     *
     * @param orgId 기관 ID
     * @return 통계 정보
     */
    @Transactional(readOnly = true)
    public OrganizationStatsResponse getOrganizationStats(Long orgId) {
        // 기관의 모든 프로젝트 조회
        List<Project> projects = projectRepository.findByOrgId(orgId);

        // 전체 프로젝트 수
        int totalProjects = projects.size();

        // 상태별 프로젝트 수 계산
        int activeProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .count();

        int settlementProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED ||
                           p.getStatus() == Project.ProjectStatus.SETTLEMENT)
                .count();

        int closedProjects = (int) projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.CLOSED)
                .count();

        // 총 모금액 계산 (모든 프로젝트)
        BigDecimal totalFunding = projects.stream()
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 진행 중인 프로젝트 모금액
        BigDecimal activeFunding = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE)
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // TODO: 저금통 테이블 구현 후 실제 잔액 계산
        // 현재는 결산 중인 프로젝트의 모금액으로 임시 대체
        BigDecimal totalWalletBalance = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.SETTLEMENT)
                .map(Project::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrganizationStatsResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .settlementProjects(settlementProjects)
                .closedProjects(closedProjects)
                .totalFunding(totalFunding)
                .activeFunding(activeFunding)
                .totalWalletBalance(totalWalletBalance)
                .build();
    }

    /**
     * 재심사 요청
     * - 거부된 기관이 정보를 수정하여 다시 승인 요청
     * - 승인 상태를 REJECTED에서 PENDING으로 변경
     * - reapplyCount 증가
     *
     * @param userId 사용자 ID
     * @param userName 담당자명
     * @param phone 연락처
     * @param organizationName 기관명
     * @param businessNumber 사업자번호
     * @param representativeName 대표자명
     * @param password 비밀번호 (본인 확인용)
     * @param file 제출서류 파일
     */
    @Transactional
    public void reapplyOrganization(Long userId, String userName, String phone,
                                   String organizationName, String businessNumber,
                                   String representativeName, String password,
                                   MultipartFile file) {
        // 1. 사용자 조회 및 비밀번호 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 2. 기관 정보 조회
        Organization org = organizationRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("기관 정보를 찾을 수 없습니다."));

        // 3. REJECTED 상태가 아니면 재신청 불가
        if (org.getApprovalStatus() != Organization.ApprovalStatus.REJECTED) {
            throw new IllegalArgumentException("재심사 요청은 거부된 기관만 가능합니다.");
        }

        // 4. User 정보 업데이트
        user.setUserName(userName);
        user.setPhone(phone);
        userRepository.save(user);

        // 5. Organization 정보 업데이트
        org.setOrgName(organizationName);
        org.setRegistrationNumber(businessNumber);
        org.setRepresentative(representativeName);
        org.setApprovalStatus(Organization.ApprovalStatus.PENDING); // 승인 대기로 변경
        org.setReapplyCount(org.getReapplyCount() + 1); // 재신청 횟수 증가
        org.setRejectionReason(null); // 거부 사유 초기화
        org.setRejectionFields(null); // 거부 필드 초기화
        organizationRepository.save(org);

        // 6. 파일이 제출된 경우 문서 업데이트
        if (file != null && !file.isEmpty()) {
            try {
                // 기존 파일 삭제 (선택사항)
                List<OrganizationDocument> existingDocs = documentRepository.findByOrganization_OrgId(org.getOrgId());
                if (!existingDocs.isEmpty()) {
                    documentRepository.deleteAll(existingDocs);
                }

                // 새 파일 저장
                String filePath = fileStorageService.saveFile(file);

                OrganizationDocument document = OrganizationDocument.builder()
                        .organization(org)
                        .docType(OrganizationDocument.DocType.BUSINESS_LICENSE)
                        .fileName(file.getOriginalFilename())
                        .filePath(filePath)
                        .fileSize(file.getSize())
                        .build();
                documentRepository.save(document);

            } catch (Exception e) {
                throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
            }
        }
    }
}
