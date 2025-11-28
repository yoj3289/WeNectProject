package com.wenect.donation_paltform.global.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import org.springframework.context.annotation.Profile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Profile("!prod")
public class TestMailController {

    private final JavaMailSender mailSender;

    @PostMapping("/mail")
    public ResponseEntity<Map<String, String>> sendTestMail(@RequestParam String email) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("wenect.noreply@gmail.com");
            message.setTo(email);
            message.setSubject("테스트 메일입니다");
            message.setText("안녕하세요!\n\nJavaMailSender를 통한 테스트 메일 발송에 성공했습니다.\n\n감사합니다.");

            mailSender.send(message);

            Map<String, String> response = new HashMap<>();
            response.put("message", "메일이 성공적으로 발송되었습니다.");
            response.put("email", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "메일 발송 실패: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
