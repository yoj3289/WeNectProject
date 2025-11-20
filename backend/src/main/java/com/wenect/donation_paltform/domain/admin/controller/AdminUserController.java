package com.wenect.donation_paltform.domain.admin.controller;

import com.wenect.donation_paltform.domain.admin.dto.UserListResponse;
import com.wenect.donation_paltform.domain.admin.service.AdminUserService;
import com.wenect.donation_paltform.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")  // ADMIN 권한만 접근 가능
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * 사용자 목록 조회 (페이징, 검색, 필터링)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserListResponse>>> getUserList(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "userType", required = false) String userType,
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<UserListResponse> users = adminUserService.getUserList(search, userType, status, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(users, "사용자 목록 조회 성공"));
    }
}
