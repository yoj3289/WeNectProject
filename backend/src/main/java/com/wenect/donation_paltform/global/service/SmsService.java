package com.wenect.donation_paltform.global.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * SMS 발송 서비스
 * NCP (Naver Cloud Platform) SENS API 연동
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final ObjectMapper objectMapper;

    @Value("${sms.ncp.enabled:false}")
    private boolean smsEnabled;

    @Value("${sms.ncp.access-key:}")
    private String accessKey;

    @Value("${sms.ncp.secret-key:}")
    private String secretKey;

    @Value("${sms.ncp.service-id:}")
    private String serviceId;

    @Value("${sms.ncp.sender-phone:}")
    private String senderPhone;

    private static final String NCP_API_URL = "https://sens.apigw.ntruss.com";

    /**
     * SMS 발송
     *
     * @param phoneNumber 수신자 전화번호 (하이픈 없이)
     * @param message     발송할 메시지
     * @return 발송 성공 여부
     */
    public boolean sendSms(String phoneNumber, String message) {
        if (!smsEnabled) {
            log.info("SMS 발송 비활성화 상태 - phone: {}, message: {}", phoneNumber, message);
            return false;
        }

        try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String url = "/sms/v2/services/" + serviceId + "/messages";
            String signature = makeSignature(timestamp, url);

            // 요청 바디 구성
            Map<String, Object> body = new HashMap<>();
            body.put("type", "SMS");
            body.put("from", senderPhone.replaceAll("-", ""));
            body.put("content", message);
            body.put("messages", List.of(Map.of("to", phoneNumber.replaceAll("-", ""))));

            String jsonBody = objectMapper.writeValueAsString(body);

            // HTTP 요청
            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpPost httpPost = new HttpPost(NCP_API_URL + url);
                httpPost.setHeader("Content-Type", "application/json; charset=utf-8");
                httpPost.setHeader("x-ncp-apigw-timestamp", timestamp);
                httpPost.setHeader("x-ncp-iam-access-key", accessKey);
                httpPost.setHeader("x-ncp-apigw-signature-v2", signature);
                httpPost.setEntity(new StringEntity(jsonBody, ContentType.APPLICATION_JSON));

                httpClient.execute(httpPost, response -> {
                    int statusCode = response.getCode();
                    if (statusCode == 202) {
                        log.info("SMS 발송 성공 - phone: {}", phoneNumber);
                    } else {
                        log.error("SMS 발송 실패 - statusCode: {}, phone: {}", statusCode, phoneNumber);
                    }
                    return null;
                });

                return true;
            }

        } catch (Exception e) {
            log.error("SMS 발송 중 오류 발생 - phone: {}", phoneNumber, e);
            return false;
        }
    }

    /**
     * 기부 완료 SMS 발송
     */
    public void sendDonationCompleteSms(String phoneNumber, String projectName, Long amount) {
        String message = String.format("[위넥트] %s 프로젝트에 %,d원 기부가 완료되었습니다. 감사합니다!", projectName, amount);
        sendSms(phoneNumber, message);
    }

    /**
     * 정산 승인 SMS 발송
     */
    public void sendSettlementApprovedSms(String phoneNumber, String projectName) {
        String message = String.format("[위넥트] '%s' 프로젝트의 정산이 승인되었습니다. 등록하신 계좌로 송금됩니다.", projectName);
        sendSms(phoneNumber, message);
    }

    /**
     * 정산 반려 SMS 발송
     */
    public void sendSettlementRejectedSms(String phoneNumber, String projectName, String reason) {
        String message = String.format("[위넥트] '%s' 프로젝트 정산이 반려되었습니다. 사유: %s", projectName, reason);
        sendSms(phoneNumber, message);
    }

    /**
     * 기관 승인 SMS 발송
     */
    public void sendOrganizationApprovedSms(String phoneNumber, String orgName) {
        String message = String.format("[위넥트] '%s' 기관 승인이 완료되었습니다. 이제 프로젝트를 등록할 수 있습니다.", orgName);
        sendSms(phoneNumber, message);
    }

    /**
     * 기관 반려 SMS 발송
     */
    public void sendOrganizationRejectedSms(String phoneNumber, String orgName, String reason) {
        String message = String.format("[위넥트] '%s' 기관 승인이 반려되었습니다. 사유: %s", orgName, reason);
        sendSms(phoneNumber, message);
    }

    /**
     * 프로젝트 마감 임박 SMS 발송
     */
    public void sendDeadlineSoonSms(String phoneNumber, String projectName, int daysLeft) {
        String message;
        if (daysLeft == 0) {
            message = String.format("[위넥트] '%s' 프로젝트가 오늘 마감됩니다!", projectName);
        } else if (daysLeft == 1) {
            message = String.format("[위넥트] '%s' 프로젝트가 내일 마감됩니다!", projectName);
        } else {
            message = String.format("[위넥트] '%s' 프로젝트가 %d일 후 마감됩니다!", projectName, daysLeft);
        }
        sendSms(phoneNumber, message);
    }

    /**
     * NCP SENS API 서명 생성
     */
    private String makeSignature(String timestamp, String url) throws Exception {
        String space = " ";
        String newLine = "\n";
        String method = "POST";

        String message = method + space + url + newLine + timestamp + newLine + accessKey;

        SecretKeySpec signingKey = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(signingKey);

        byte[] rawHmac = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(rawHmac);
    }
}
