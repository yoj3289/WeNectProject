package com.wenect.donation_paltform.global.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String baseUploadDir;

    private String getUploadDir() {
        return baseUploadDir + "/documents/";
    }

    private String getProjectImagesDir() {
        return baseUploadDir + "/projects/images/";
    }

    private String getProjectDocumentsDir() {
        return baseUploadDir + "/projects/documents/";
    }

    public String saveFile(MultipartFile file) throws IOException {
        // 파일명 중복 방지
        String originalFilename = file.getOriginalFilename();
        String fileName = System.currentTimeMillis() + "_" + originalFilename;

        // 저장 경로 생성
        Path uploadPath = Paths.get(getUploadDir());
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 파일 저장
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/documents/" + fileName;
    }

    /**
     * 프로젝트 이미지 저장
     */
    public String saveProjectImage(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileName = System.currentTimeMillis() + "_" + originalFilename;

        Path uploadPath = Paths.get(getProjectImagesDir());
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/projects/images/" + fileName;
    }

    /**
     * 프로젝트 문서 저장
     */
    public String saveProjectDocument(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileName = System.currentTimeMillis() + "_" + originalFilename;

        Path uploadPath = Paths.get(getProjectDocumentsDir());
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/projects/documents/" + fileName;
    }

    /**
     * 파일 삭제
     * @param filePath 삭제할 파일의 경로 (예: "/uploads/projects/images/123456_image.jpg")
     */
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return;
        }

        try {
            // URL 경로를 실제 파일 시스템 경로로 변환
            // "/uploads/projects/images/file.jpg" -> "uploads/projects/images/file.jpg"
            String relativePath = filePath.startsWith("/") ? filePath.substring(1) : filePath;

            // baseUploadDir를 사용하여 경로 구성
            String fullPath = relativePath.replace("uploads", baseUploadDir);
            Path path = Paths.get(fullPath);

            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (IOException e) {
            // 파일 삭제 실패는 로깅만 하고 예외를 던지지 않음
            System.err.println("파일 삭제 실패: " + filePath + " - " + e.getMessage());
        }
    }
}
