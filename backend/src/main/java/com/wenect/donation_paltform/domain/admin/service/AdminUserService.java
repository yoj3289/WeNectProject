package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.UserListResponse;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    /**
     * 사용자 목록 조회 (페이징, 검색, 필터링)
     * [성능 개선] N+1 문제 해결 - 기관 정보를 배치로 조회
     */
    public Page<UserListResponse> getUserList(String search, String userType, String status, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> cb.conjunction();

        // 검색 조건 (이름 또는 이메일)
        if (search != null && !search.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(root.get("userName"), "%" + search + "%"),
                            cb.like(root.get("email"), "%" + search + "%")
                    )
            );
        }

        // 사용자 타입 필터
        if (userType != null && !userType.equals("all")) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("userType"), User.UserType.valueOf(userType.toUpperCase()))
            );
        }

        // 상태 필터
        if (status != null && !status.equals("all")) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), User.UserStatus.valueOf(status.toUpperCase()))
            );
        }

        Page<User> users = userRepository.findAll(spec, pageable);

        // [성능 개선] 기관 회원 ID 목록 추출 후 배치 조회 (N+1 -> 1+1 쿼리)
        List<Long> orgUserIds = users.getContent().stream()
                .filter(user -> user.getUserType() == User.UserType.ORGANIZATION)
                .map(User::getUserId)
                .collect(Collectors.toList());

        // 기관 정보를 한 번에 조회하여 Map으로 변환
        Map<Long, Organization> orgMap = orgUserIds.isEmpty()
                ? Map.of()
                : organizationRepository.findByUserIdIn(orgUserIds).stream()
                        .collect(Collectors.toMap(org -> org.getUser().getUserId(), org -> org));

        // User를 UserListResponse로 변환 (Organization 정보 포함)
        return users.map(user -> {
            String orgName = null;
            Boolean verified = null;

            // 기관 회원인 경우 캐시된 Organization 정보 사용
            if (user.getUserType() == User.UserType.ORGANIZATION) {
                Organization org = orgMap.get(user.getUserId());
                if (org != null) {
                    orgName = org.getOrgName();
                    verified = org.getVerified();
                }
            }

            return UserListResponse.from(user, orgName, verified);
        });
    }
}
