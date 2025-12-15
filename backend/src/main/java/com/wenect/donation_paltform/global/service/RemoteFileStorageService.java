package com.wenect.donation_paltform.global.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * 원격 파일 저장 서비스
 * 로컬 환경에서 VM 서버로 파일을 업로드
 */
@Service
public class RemoteFileStorageService {

    @Value("${remote.upload.enabled:false}")
    private boolean remoteUploadEnabled;

    @Value("${remote.upload.url:http://140.245.64.178:8080}")
    private String remoteUploadUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final FileStorageService localFileStorageService;

    public RemoteFileStorageService(FileStorageService localFileStorageService) {
        this.localFileStorageService = localFileStorageService;
    }

    /**
     * 일반 파일 저장 (로컬만 지원)
     */
    public String saveFile(MultipartFile file) throws IOException {
        // 일반 파일은 로컬에만 저장 (인증 관련 파일 등)
        return localFileStorageService.saveFile(file);
    }

    /**
     * 프로젝트 이미지 저장 (로컬 또는 원격)
     */
    public String saveProjectImage(MultipartFile file) throws IOException {
        if (remoteUploadEnabled) {
            return uploadToRemote(file, "/api/files/upload/project-image");
        } else {
            return localFileStorageService.saveProjectImage(file);
        }
    }

    /**
     * 프로젝트 문서 저장 (로컬 또는 원격)
     */
    public String saveProjectDocument(MultipartFile file) throws IOException {
        if (remoteUploadEnabled) {
            return uploadToRemote(file, "/api/files/upload/project-document");
        } else {
            return localFileStorageService.saveProjectDocument(file);
        }
    }

    /**
     * 영수증 이미지 저장 (로컬 또는 원격)
     */
    public String saveExpenseReceipt(MultipartFile file) throws IOException {
        if (remoteUploadEnabled) {
            return uploadToRemote(file, "/api/files/upload/expense-receipt");
        } else {
            return localFileStorageService.saveExpenseReceipt(file);
        }
    }

    /**
     * 기관 프로필 이미지 (로고) 저장 (로컬 또는 원격)
     */
    public String saveOrganizationImage(MultipartFile file) throws IOException {
        if (remoteUploadEnabled) {
            return uploadToRemote(file, "/api/files/upload/organization-image");
        } else {
            return localFileStorageService.saveOrganizationImage(file);
        }
    }

    /**
     * 사용자 프로필 이미지 저장 (로컬 또는 원격)
     */
    public String saveUserProfileImage(MultipartFile file) throws IOException {
        if (remoteUploadEnabled) {
            return uploadToRemote(file, "/api/files/upload/user-profile");
        } else {
            return localFileStorageService.saveUserProfileImage(file);
        }
    }

    /**
     * 원격 서버로 파일 업로드
     */
    private String uploadToRemote(MultipartFile file, String endpoint) throws IOException {
        try {
            String url = remoteUploadUrl + endpoint;

            // MultipartFile을 ByteArrayResource로 변환
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            // Multipart 요청 구성
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // POST 요청
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("filePath");
            } else {
                throw new IOException("원격 업로드 실패: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new IOException("원격 서버로 파일 업로드 중 오류: " + e.getMessage(), e);
        }
    }

    /**
     * 파일 삭제 (로컬 전용)
     */
    public void deleteFile(String filePath) {
        if (!remoteUploadEnabled) {
            localFileStorageService.deleteFile(filePath);
        }
        // 원격 모드에서는 삭제 기능 제공하지 않음 (필요시 추가 구현)
    }
}
