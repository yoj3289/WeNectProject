package com.wenect.donation_paltform.domain.admin.controller;

import com.wenect.donation_paltform.domain.admin.dto.OrganizationApprovalResponse;
import com.wenect.donation_paltform.domain.admin.service.AdminOrganizationService;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/organizations")
@RequiredArgsConstructor
public class AdminOrganizationController {

    private final AdminOrganizationService organizationService;

    /**
     * 기관 승인 목록 조회 (상태별 필터링)
     * GET /api/admin/organizations/approvals?status=all|pending|approved|rejected
     */
    @GetMapping("/approvals")
    public ResponseEntity<Map<String, Object>> getOrganizationApprovals(
            @RequestParam(required = false, defaultValue = "all") String status
    ) {
        List<OrganizationApprovalResponse> organizations = organizationService.getAllOrganizations(status);

        // 상태별 개수
        long pendingCount = organizationService.countByStatus(Organization.ApprovalStatus.PENDING);
        long approvedCount = organizationService.countByStatus(Organization.ApprovalStatus.APPROVED);
        long rejectedCount = organizationService.countByStatus(Organization.ApprovalStatus.REJECTED);

        Map<String, Object> response = new HashMap<>();
        response.put("content", organizations);
        response.put("stats", Map.of(
                "pending", pendingCount,
                "approved", approvedCount,
                "rejected", rejectedCount
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * 기관 승인
     * PUT /api/admin/organizations/{userId}/approve
     */
    @PutMapping("/{userId}/approve")
    public ResponseEntity<Map<String, String>> approveOrganization(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> request
    ) {
        organizationService.approveOrganization(userId);

        return ResponseEntity.ok(Map.of(
                "message", "기관 승인이 완료되었습니다.",
                "status", "success"
        ));
    }

    /**
     * 기관 거부
     * PUT /api/admin/organizations/{userId}/reject
     */
    @PutMapping("/{userId}/reject")
    public ResponseEntity<Map<String, String>> rejectOrganization(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request
    ) {
        String rejectionReason = (String) request.get("rejectionReason");
        String rejectionFields = (String) request.get("rejectionFields");  // JSON 문자열

        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "거절 사유를 입력해주세요.",
                    "status", "error"
            ));
        }

        organizationService.rejectOrganization(userId, rejectionReason, rejectionFields);

        return ResponseEntity.ok(Map.of(
                "message", "기관 승인이 거부되었습니다.",
                "status", "success"
        ));
    }
}
