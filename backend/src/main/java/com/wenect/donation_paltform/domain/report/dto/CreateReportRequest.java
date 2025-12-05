package com.wenect.donation_paltform.domain.report.dto;

import com.wenect.donation_paltform.domain.report.entity.Report.ReportReason;
import com.wenect.donation_paltform.domain.report.entity.Report.ReportType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReportRequest {

    private Long reportedItemId;

    private ReportType reportType;

    private ReportReason reason;

    private String description;
}
