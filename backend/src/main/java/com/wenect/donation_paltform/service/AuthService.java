package com.wenect.donation_paltform.service;

import com.wenect.donation_paltform.dto.LoginRequestDto;
import com.wenect.donation_paltform.dto.LoginResponseDto;
import com.wenect.donation_paltform.dto.SignupRequestDto;
import com.wenect.donation_paltform.dto.SignupResponseDto;
import com.wenect.donation_paltform.entity.Organization;
import com.wenect.donation_paltform.entity.OrganizationDocument;
import com.wenect.donation_paltform.entity.User;
import com.wenect.donation_paltform.exception.DuplicateEmailException;
import com.wenect.donation_paltform.repository.OrganizationDocumentRepository;
import com.wenect.donation_paltform.repository.OrganizationRepository;
import com.wenect.donation_paltform.repository.UserRepository;
import com.wenect.donation_paltform.util.JwtTokenProvider;

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

    private final FileStorageService fileStorageService; // 필드 추가 (23줄 아래)

    private final OrganizationRepository organizationRepository;

    private final OrganizationDocumentRepository documentRepository;

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
        // 6. 응답 DTO 변환
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

        // 4. 응답 DTO 변환
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

        // 4. JWT 토큰 생성
        String token = jwtTokenProvider.createToken(
                user.getUserId(),
                user.getEmail(),
                user.getUserType().name());

        // 5. 응답 DTO 반환
        return LoginResponseDto.of(token, user);
    }
}