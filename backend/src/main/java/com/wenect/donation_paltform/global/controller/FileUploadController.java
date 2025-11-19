package com.wenect.donation_paltform.global.controller;

import com.wenect.donation_paltform.global.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 파일 업로드 API 컨트롤러
 * 로컬 개발 환경에서 VM 서버로 파일을 업로드하기 위한 엔드포인트
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    /**
     * 프로젝트 이미지 업로드 (원격)
     */
    @PostMapping("/upload/project-image")
    public ResponseEntity<Map<String, String>> uploadProjectImage(
            @RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.saveProjectImage(file);

            Map<String, String> response = new HashMap<>();
            response.put("filePath", filePath);
            response.put("fileName", file.getOriginalFilename());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * 프로젝트 문서 업로드 (원격)
     */
    @PostMapping("/upload/project-document")
    public ResponseEntity<Map<String, String>> uploadProjectDocument(
            @RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.saveProjectDocument(file);

            Map<String, String> response = new HashMap<>();
            response.put("filePath", filePath);
            response.put("fileName", file.getOriginalFilename());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * 영수증 이미지 업로드 (원격)
     */
    @PostMapping("/upload/expense-receipt")
    public ResponseEntity<Map<String, String>> uploadExpenseReceipt(
            @RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.saveExpenseReceipt(file);

            Map<String, String> response = new HashMap<>();
            response.put("filePath", filePath);
            response.put("fileName", file.getOriginalFilename());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
