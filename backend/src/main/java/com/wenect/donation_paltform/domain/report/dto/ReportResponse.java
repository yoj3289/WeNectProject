package com.wenect.donation_paltform.domain.report.dto;

import com.wenect.donation_paltform.domain.report.entity.Report;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {

    private Long reportId;
    private Long userId;
    private String reporterName;
    private Long reportedUserId;
    private String reportedUserName;
    private Long reportedItemId;
    private String reportedItemTitle;
    private String reportType;
    private String reason;
    private String reasonLabel;
    private String description;
    private String status;
    private String statusLabel;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    public static ReportResponse from(Report report) {
        return ReportResponse.builder()
                .reportId(report.getReportId())
                .userId(report.getUserId())
                .reportedUserId(report.getReportedUserId())
                .reportedItemId(report.getReportedItemId())
                .reportType(report.getReportType().name())
                .reason(report.getReason().name())
                .reasonLabel(getReasonLabel(report.getReason()))
                .description(report.getDescription())
                .status(report.getStatus().name())
                .statusLabel(getStatusLabel(report.getStatus()))
                .adminNote(report.getAdminNote())
                .createdAt(report.getCreatedAt())
                .processedAt(report.getProcessedAt())
                .build();
    }

    public static ReportResponse fromWithDetails(
            Report report,
            String reporterName,
            String reportedUserName,
            String reportedItemTitle
    ) {
        ReportResponse response = from(report);
        response.setReporterName(reporterName);
        response.setReportedUserName(reportedUserName);
        response.setReportedItemTitle(reportedItemTitle);
        return response;
    }

    private static String getReasonLabel(Report.ReportReason reason) {
        return switch (reason) {
            case INAPPROPRIATE_CONTENT -> "부적절한 콘텐츠";
            case SPAM -> "스팸";
            case HARASSMENT -> "괴롭힘/혐오";
            case FRAUD -> "사기/허위정보";
            case COPYRIGHT -> "저작권 침해";
            case PERSONAL_INFO -> "개인정보 노출";
            case OTHER -> "기타";
        };
    }

    private static String getStatusLabel(Report.ReportStatus status) {
        return switch (status) {
            case PENDING -> "대기중";
            case UNDER_REVIEW -> "검토중";
            case RESOLVED -> "처리완료";
            case REJECTED -> "반려됨";
        };
    }
}
