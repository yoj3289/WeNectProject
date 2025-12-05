package com.wenect.donation_paltform.domain.report.dto;

import com.wenect.donation_paltform.domain.report.entity.Report.ReportStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessReportRequest {

    private ReportStatus status;

    private String adminNote;
}
