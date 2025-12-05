package com.wenect.donation_paltform.domain.report.service;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.community.entity.Comment;
import com.wenect.donation_paltform.domain.community.entity.Post;
import com.wenect.donation_paltform.domain.community.repository.CommentRepository;
import com.wenect.donation_paltform.domain.community.repository.PostRepository;
import com.wenect.donation_paltform.domain.notification.service.NotificationService;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.report.dto.CreateReportRequest;
import com.wenect.donation_paltform.domain.report.dto.ProcessReportRequest;
import com.wenect.donation_paltform.domain.report.dto.ReportResponse;
import com.wenect.donation_paltform.domain.report.entity.Report;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportStatus;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportType;
import com.wenect.donation_paltform.domain.report.repository.ReportRepository;
import com.wenect.donation_paltform.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;

    /**
     * 신고 생성
     */
    @Transactional
    public ReportResponse createReport(Long userId, CreateReportRequest request) {
        // 중복 신고 확인
        if (reportRepository.existsByUserIdAndReportedItemIdAndReportTypeAndIsDeletedFalse(
                userId, request.getReportedItemId(), request.getReportType())) {
            throw new IllegalArgumentException("이미 신고한 항목입니다.");
        }

        // 신고 대상 정보 조회
        Long reportedUserId = getReportedUserId(request.getReportedItemId(), request.getReportType());

        // 자기 자신을 신고하는 경우 방지
        if (reportedUserId != null && reportedUserId.equals(userId)) {
            throw new IllegalArgumentException("자신의 콘텐츠는 신고할 수 없습니다.");
        }

        // 신고 엔티티 생성
        Report report = Report.builder()
                .userId(userId)
                .reportedUserId(reportedUserId)
                .reportedItemId(request.getReportedItemId())
                .reportType(request.getReportType())
                .reason(request.getReason())
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .build();

        Report savedReport = reportRepository.save(report);
        log.info("신고 생성: reportId={}, userId={}, type={}",
                savedReport.getReportId(), userId, request.getReportType());

        // 관리자에게 알림 전송 (ADMIN 역할 사용자에게)
        sendAdminNotification(savedReport);

        return enrichReportResponse(savedReport);
    }

    /**
     * 신고 상세 조회
     */
    public ReportResponse getReport(Long reportId) {
        Report report = reportRepository.findByReportIdAndIsDeletedFalse(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));
        return enrichReportResponse(report);
    }

    /**
     * 내 신고 목록 조회
     */
    public PageResponse<ReportResponse> getMyReports(Long userId, Pageable pageable) {
        Page<Report> reports = reportRepository.findByUserIdAndIsDeletedFalse(userId, pageable);
        return convertToPageResponse(reports);
    }

    /**
     * 신고 목록 조회 (관리자용)
     */
    public PageResponse<ReportResponse> getReports(
            ReportStatus status,
            ReportType reportType,
            Pageable pageable
    ) {
        Page<Report> reports = reportRepository.findByFilters(status, reportType, pageable);
        return convertToPageResponse(reports);
    }

    /**
     * 신고 처리 (관리자용)
     */
    @Transactional
    public ReportResponse processReport(Long reportId, Long adminId, ProcessReportRequest request) {
        Report report = reportRepository.findByReportIdAndIsDeletedFalse(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));

        report.process(request.getStatus(), request.getAdminNote(), adminId);
        Report savedReport = reportRepository.save(report);

        log.info("신고 처리: reportId={}, adminId={}, status={}",
                reportId, adminId, request.getStatus());

        // 신고가 승인(RESOLVED)된 경우 제재 적용
        if (request.getStatus() == ReportStatus.RESOLVED && report.getReportedUserId() != null) {
            applyPenaltyToUser(report.getReportedUserId(), report);
        }

        // 신고자에게 처리 결과 알림
        sendReporterNotification(savedReport);

        return enrichReportResponse(savedReport);
    }

    /**
     * 사용자에게 제재 적용 (3회 경고, 5회 정지, 7회 영구정지)
     */
    private void applyPenaltyToUser(Long userId, Report report) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("제재 적용 실패: 사용자를 찾을 수 없습니다. userId={}", userId);
            return;
        }

        String reason = String.format("[%s] %s",
                getReportTypeLabel(report.getReportType()),
                report.getReason().name());

        String penaltyType = user.applyPenalty(reason);
        userRepository.save(user);

        log.info("제재 적용: userId={}, warningCount={}, penaltyType={}",
                userId, user.getWarningCount(), penaltyType);

        // 제재 대상자에게 알림 전송
        sendPenaltyNotification(user, penaltyType);
    }

    /**
     * 제재 대상자에게 알림 전송
     */
    private void sendPenaltyNotification(User user, String penaltyType) {
        try {
            String title;
            String message;

            switch (penaltyType) {
                case "WARNING":
                    title = "경고 알림";
                    message = String.format("회원님의 콘텐츠가 신고되어 경고 처리되었습니다. (누적 %d회)", user.getWarningCount());
                    break;
                case "SUSPENDED":
                    title = "계정 정지 알림";
                    message = String.format("회원님의 계정이 30일간 정지되었습니다. (누적 경고 %d회)", user.getWarningCount());
                    break;
                case "PERMANENTLY_BANNED":
                    title = "계정 영구정지 알림";
                    message = "회원님의 계정이 영구정지되었습니다. 더 이상 서비스를 이용할 수 없습니다.";
                    break;
                default:
                    return; // NONE인 경우 알림 안 보냄
            }

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("penaltyType", penaltyType);
            metadata.put("warningCount", user.getWarningCount());

            notificationService.createNotification(
                    user.getUserId(),
                    "penalty_applied",
                    "system",
                    title,
                    message,
                    null,
                    metadata
            );
        } catch (Exception e) {
            log.warn("제재 알림 전송 실패: {}", e.getMessage());
        }
    }

    /**
     * 신고 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteReport(Long reportId, Long userId) {
        Report report = reportRepository.findByReportIdAndIsDeletedFalse(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));

        // 본인의 신고만 삭제 가능 (처리 전에만)
        if (!report.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 신고만 삭제할 수 있습니다.");
        }
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new IllegalArgumentException("처리 중이거나 완료된 신고는 삭제할 수 없습니다.");
        }

        report.softDelete();
        reportRepository.save(report);
        log.info("신고 삭제: reportId={}, userId={}", reportId, userId);
    }

    /**
     * 신고 통계 조회 (관리자용)
     */
    public Map<String, Object> getReportStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingCount", reportRepository.countByStatusAndIsDeletedFalse(ReportStatus.PENDING));
        stats.put("underReviewCount", reportRepository.countByStatusAndIsDeletedFalse(ReportStatus.UNDER_REVIEW));
        stats.put("resolvedCount", reportRepository.countByStatusAndIsDeletedFalse(ReportStatus.RESOLVED));
        stats.put("rejectedCount", reportRepository.countByStatusAndIsDeletedFalse(ReportStatus.REJECTED));
        stats.put("todayCount", reportRepository.countTodayReports());
        return stats;
    }

    // === Private Helper Methods ===

    private Long getReportedUserId(Long itemId, ReportType type) {
        return switch (type) {
            case COMMENT -> {
                Comment comment = commentRepository.findById(itemId)
                        .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
                yield comment.getUserId();
            }
            case POST -> {
                Post post = postRepository.findById(itemId)
                        .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                yield post.getUserId();
            }
            case PROJECT -> {
                Project project = projectRepository.findById(itemId)
                        .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
                // orgId로 Organization을 찾아서 User ID 반환
                Organization org = organizationRepository.findById(project.getOrgId())
                        .orElseThrow(() -> new IllegalArgumentException("단체를 찾을 수 없습니다."));
                yield org.getUser().getUserId();
            }
            case USER -> {
                userRepository.findById(itemId)
                        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
                yield itemId;
            }
        };
    }

    private String getReportedItemTitle(Long itemId, ReportType type) {
        return switch (type) {
            case COMMENT -> {
                Comment comment = commentRepository.findById(itemId).orElse(null);
                yield comment != null ?
                    (comment.getContent().length() > 30 ?
                        comment.getContent().substring(0, 30) + "..." :
                        comment.getContent())
                    : "삭제된 댓글";
            }
            case POST -> {
                Post post = postRepository.findById(itemId).orElse(null);
                yield post != null ? post.getTitle() : "삭제된 게시글";
            }
            case PROJECT -> {
                Project project = projectRepository.findById(itemId).orElse(null);
                yield project != null ? project.getTitle() : "삭제된 프로젝트";
            }
            case USER -> {
                User user = userRepository.findById(itemId).orElse(null);
                yield user != null ? user.getUserName() : "탈퇴한 사용자";
            }
        };
    }

    private ReportResponse enrichReportResponse(Report report) {
        String reporterName = userRepository.findById(report.getUserId())
                .map(User::getUserName)
                .orElse("알 수 없음");

        String reportedUserName = report.getReportedUserId() != null ?
                userRepository.findById(report.getReportedUserId())
                        .map(User::getUserName)
                        .orElse("알 수 없음") : null;

        String reportedItemTitle = getReportedItemTitle(
                report.getReportedItemId(), report.getReportType());

        return ReportResponse.fromWithDetails(report, reporterName, reportedUserName, reportedItemTitle);
    }

    private PageResponse<ReportResponse> convertToPageResponse(Page<Report> reports) {
        return new PageResponse<>(
                reports.map(this::enrichReportResponse).getContent(),
                reports.getNumber(),
                reports.getTotalPages(),
                reports.getTotalElements(),
                reports.getSize()
        );
    }

    private void sendAdminNotification(Report report) {
        try {
            // ADMIN 역할 사용자들에게 알림 전송
            userRepository.findByUserType(User.UserType.ADMIN).forEach(admin -> {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("reportId", report.getReportId());
                metadata.put("reportType", report.getReportType().name());

                notificationService.createNotification(
                        admin.getUserId(),
                        "report_received",
                        "admin",
                        "새로운 신고가 접수되었습니다",
                        String.format("[%s] 신고가 접수되었습니다. 확인해주세요.",
                                getReportTypeLabel(report.getReportType())),
                        "/admin/reports",
                        metadata
                );
            });
        } catch (Exception e) {
            log.warn("관리자 알림 전송 실패: {}", e.getMessage());
        }
    }

    private void sendReporterNotification(Report report) {
        try {
            String statusMessage = switch (report.getStatus()) {
                case RESOLVED -> "처리가 완료되었습니다.";
                case REJECTED -> "반려되었습니다.";
                default -> "처리 중입니다.";
            };

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("reportId", report.getReportId());
            metadata.put("status", report.getStatus().name());

            notificationService.createNotification(
                    report.getUserId(),
                    "report_processed",
                    "system",
                    "신고 처리 결과 안내",
                    String.format("접수하신 신고가 %s", statusMessage),
                    null,
                    metadata
            );
        } catch (Exception e) {
            log.warn("신고자 알림 전송 실패: {}", e.getMessage());
        }
    }

    private String getReportTypeLabel(ReportType type) {
        return switch (type) {
            case COMMENT -> "댓글";
            case POST -> "게시글";
            case PROJECT -> "프로젝트";
            case USER -> "사용자";
        };
    }
}
