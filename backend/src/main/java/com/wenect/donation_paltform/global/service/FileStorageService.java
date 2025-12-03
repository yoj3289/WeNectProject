package com.wenect.donation_paltform.global.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String baseUploadDir;

    /**
     * 파일명에서 확장자 추출
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * 안전한 파일명 생성 (한글 및 특수문자 제거)
     * 타임스탬프 + UUID + 확장자 조합으로 고유한 파일명 생성
     */
    private String generateSafeFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return System.currentTimeMillis() + "_" + uuid + extension;
    }

    /**
     * 절대 경로로 변환된 업로드 디렉토리 반환
     */
    private Path getAbsoluteUploadPath(String relativePath) {
        // 상대 경로인 경우 프로젝트 루트 기준으로 절대 경로 생성
        Path path = Paths.get(baseUploadDir).resolve(relativePath);
        if (!path.isAbsolute()) {
            // 현재 작업 디렉토리 기준으로 절대 경로 변환
            path = Paths.get(System.getProperty("user.dir")).resolve(path);
        }
        return path;
    }

    private String getUploadDir() {
        return baseUploadDir + "/documents/";
    }

    private String getProjectImagesDir() {
        return baseUploadDir + "/projects/images/";
    }

    private String getProjectDocumentsDir() {
        return baseUploadDir + "/projects/documents/";
    }

    private String getExpenseReceiptsDir() {
        return baseUploadDir + "/expenses/receipts/";
    }

    private String getCommunityPostImagesDir() {
        return baseUploadDir + "/community/posts/";
    }

    public String saveFile(MultipartFile file) throws IOException {
        // 안전한 파일명 생성 (한글 제거)
        String fileName = generateSafeFileName(file.getOriginalFilename());

        // 저장 경로 생성 (절대 경로)
        Path uploadPath = getAbsoluteUploadPath("documents");
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
        // 안전한 파일명 생성 (한글 제거)
        String fileName = generateSafeFileName(file.getOriginalFilename());

        // 절대 경로 사용
        Path uploadPath = getAbsoluteUploadPath("projects/images");
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
        // 안전한 파일명 생성 (한글 제거)
        String fileName = generateSafeFileName(file.getOriginalFilename());

        // 절대 경로 사용
        Path uploadPath = getAbsoluteUploadPath("projects/documents");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/projects/documents/" + fileName;
    }

    /**
     * 영수증 이미지 저장
     */
    public String saveExpenseReceipt(MultipartFile file) throws IOException {
        // 안전한 파일명 생성 (한글 제거)
        String fileName = generateSafeFileName(file.getOriginalFilename());

        // 절대 경로 사용
        Path uploadPath = getAbsoluteUploadPath("expenses/receipts");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/expenses/receipts/" + fileName;
    }

    /**
     * 커뮤니티 게시글 이미지 저장
     */
    public String saveCommunityPostImage(MultipartFile file) throws IOException {
        // 안전한 파일명 생성 (한글 제거)
        String fileName = generateSafeFileName(file.getOriginalFilename());

        // 절대 경로 사용
        Path uploadPath = getAbsoluteUploadPath("community/posts");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/community/posts/" + fileName;
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
