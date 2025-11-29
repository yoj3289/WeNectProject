package com.wenect.donation_paltform.domain.auth.service;

import com.wenect.donation_paltform.domain.auth.dto.LoginRequestDto;
import com.wenect.donation_paltform.domain.auth.dto.LoginResponseDto;
import com.wenect.donation_paltform.domain.auth.dto.SignupRequestDto;
import com.wenect.donation_paltform.domain.auth.dto.SignupResponseDto;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import com.wenect.donation_paltform.domain.organization.entity.OrganizationDocument;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.exception.DuplicateEmailException;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationDocumentRepository;
import com.wenect.donation_paltform.domain.organization.repository.OrganizationRepository;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.global.util.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final JwtTokenProvider jwtTokenProvider; // 251031추가

    private final com.wenect.donation_paltform.global.service.RemoteFileStorageService fileStorageService; // 필드 추가 (23줄 아래)

    private final OrganizationRepository organizationRepository;

    private final OrganizationDocumentRepository documentRepository;

    private final com.wenect.donation_paltform.domain.auth.repository.EmailVerificationRepository emailVerificationRepository;

    @Transactional
    public SignupResponseDto signup(SignupRequestDto dto, MultipartFile file) {
        // 1. 이메일 중복 확인
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateEmailException();
        }

        // 디버그 로그 추가
        System.out.println("========== 회원가입 시작 ==========");
        System.out.println("UserType: " + dto.getUserType());
        System.out.println("File: " + (file != null ? file.getOriginalFilename() : "null"));
        System.out.println("OrganizationName: " + dto.getOrganizationName());
        System.out.println("BusinessNumber: " + dto.getBusinessNumber());

        // 2. 파일 저장 (기관 회원인 경우)
        if (dto.getUserType() == User.UserType.ORGANIZATION && file != null) {
            try {
                String filePath = fileStorageService.saveFile(file);
                dto.setDocumentPath(filePath); // DTO에 파일 경로 설정
            } catch (Exception e) {
                throw new RuntimeException("파일 저장 중 오류가 발생했습니다", e);
            }
        }

        // 3. User 엔티티 생성
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .userName(dto.getUserName())
                .phone(dto.getPhone())
                .userType(dto.getUserType())
                .build();

        // 4. DB 저장
        User savedUser = userRepository.save(user);

        // 5. 기관 회원인 경우 organizations와 파일 저장
        if (dto.getUserType() == User.UserType.ORGANIZATION) {
            // 5-1. organizations 테이블 저장
            Organization org = Organization.builder()
                    .user(savedUser)
                    .orgName(dto.getOrganizationName())
                    .registrationNumber(dto.getBusinessNumber())
                    .representative(dto.getRepresentativeName())
                    .approvalStatus(Organization.ApprovalStatus.PENDING) // 승인 대기 상태
                    .verified(false) // 관리자 승인 전
                    .build();
            Organization savedOrg = organizationRepository.save(org);

            // 5-2. organization_documents 테이블에 파일 정보 저장
            if (file != null && dto.getDocumentPath() != null) {
                OrganizationDocument document = OrganizationDocument.builder()
                        .organization(savedOrg)
                        .docType(OrganizationDocument.DocType.BUSINESS_LICENSE) // 사업자등록증
                        .fileName(file.getOriginalFilename())
                        .filePath(dto.getDocumentPath())
                        .fileSize(file.getSize())
                        .build();
                documentRepository.save(document);
            }
        }

        // 6. 이메일 인증 데이터 삭제 (회원가입 완료 후 정리)
        try {
            emailVerificationRepository.deleteByEmail(dto.getEmail());
        } catch (Exception e) {
            // 삭제 실패해도 회원가입은 성공으로 처리
            System.out.println("이메일 인증 데이터 삭제 실패 (무시): " + e.getMessage());
        }

        // 7. 응답 DTO 변환
        return SignupResponseDto.from(savedUser);
    }

    @Transactional
    public SignupResponseDto signup(SignupRequestDto dto) {
        // 1. 이메일 중복 확인
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateEmailException();
        }

        // 2. User 엔티티 생성
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword())) // 비밀번호 암호화
                .userName(dto.getUserName())
                .phone(dto.getPhone())
                .userType(dto.getUserType())
                .build();

        // 3. DB 저장
        User savedUser = userRepository.save(user);

        // 4. 이메일 인증 데이터 삭제 (회원가입 완료 후 정리)
        try {
            emailVerificationRepository.deleteByEmail(dto.getEmail());
        } catch (Exception e) {
            // 삭제 실패해도 회원가입은 성공으로 처리
            System.out.println("이메일 인증 데이터 삭제 실패 (무시): " + e.getMessage());
        }

        // 5. 응답 DTO 변환
        return SignupResponseDto.from(savedUser);
    }

    // 이메일 중복 체크 API용
    public boolean checkEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    // 로그인 메서드 추가
    @Transactional(readOnly = true)
    public LoginResponseDto login(LoginRequestDto dto) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다"));

        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        // 3. 계정 상태 확인
        if (user.getStatus() == User.UserStatus.SUSPENDED) {
            throw new IllegalStateException("정지된 계정입니다. 관리자에게 문의하세요");
        }

        if (user.getStatus() == User.UserStatus.INACTIVE) {
            throw new IllegalStateException("비활성화된 계정입니다");
        }

        // 4. 기관명 조회 및 승인 상태 확인 (기관 사용자인 경우)
        String organizationName = null;
        if (user.getUserType() == User.UserType.ORGANIZATION) {
            Organization organization = organizationRepository.findByUser_UserId(user.getUserId())
                    .orElse(null);

            if (organization != null) {
                // 승인 상태 확인
                if (organization.getApprovalStatus() == Organization.ApprovalStatus.PENDING) {
                    throw new IllegalStateException("승인 대기 중인 계정입니다. 관리자의 승인을 기다려주세요");
                }

                // REJECTED 상태인 경우 거부 정보 반환
                if (organization.getApprovalStatus() == Organization.ApprovalStatus.REJECTED) {
                    return LoginResponseDto.ofRejected(
                            user,
                            organization.getOrgName(),
                            organization.getRegistrationNumber(),
                            organization.getRepresentative(),
                            organization.getRejectionReason(),
                            organization.getRejectionFields(),
                            organization.getLastRejectedAt()
                    );
                }

                organizationName = organization.getOrgName();
            }
        }

        // 5. JWT 토큰 생성
        String token = jwtTokenProvider.createToken(
                user.getUserId(),
                user.getEmail(),
                user.getUserType().name());

        // 6. 응답 DTO 반환
        return LoginResponseDto.of(token, user, organizationName);
    }
}