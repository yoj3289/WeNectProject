package com.wenect.donation_paltform.domain.organization.service;

import com.wenect.donation_paltform.domain.organization.entity.Organization;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationEmailService {

    private final JavaMailSender mailSender;

    /**
     * 기관 승인 알림 메일 발송 (비동기)
     */
    @Async("emailTaskExecutor")
    public void sendApprovalEmail(Organization organization) {
        try {
            String userEmail = organization.getUser().getEmail();
            String orgName = organization.getOrgName();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("wenect.noreply@gmail.com");
            helper.setTo(userEmail);
            helper.setSubject("[WeNect] 기관 회원가입이 승인되었습니다");

            String htmlContent = buildApprovalEmailTemplate(orgName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("기관 승인 알림 메일 발송 성공: orgName={}, to={}", orgName, userEmail);
        } catch (Exception e) {
            log.error("기관 승인 알림 메일 발송 실패: orgName={}, error={}", organization.getOrgName(), e.getMessage(), e);
            // 이메일 전송 실패 시에도 메인 로직은 정상 처리
        }
    }

    /**
     * 기관 반려 알림 메일 발송 (비동기)
     */
    @Async("emailTaskExecutor")
    public void sendRejectionEmail(Organization organization) {
        try {
            String userEmail = organization.getUser().getEmail();
            String orgName = organization.getOrgName();
            String rejectionReason = organization.getRejectionReason();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("wenect.noreply@gmail.com");
            helper.setTo(userEmail);
            helper.setSubject("[WeNect] 기관 회원가입이 반려되었습니다");

            String htmlContent = buildRejectionEmailTemplate(orgName, rejectionReason);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("기관 반려 알림 메일 발송 성공: orgName={}, to={}", orgName, userEmail);
        } catch (Exception e) {
            log.error("기관 반려 알림 메일 발송 실패: orgName={}, error={}", organization.getOrgName(), e.getMessage(), e);
            // 이메일 전송 실패 시에도 메인 로직은 정상 처리
        }
    }

    /**
     * 승인 메일 HTML 템플릿
     */
    private String buildApprovalEmailTemplate(String orgName) {
        return "<!DOCTYPE html>" +
                "<html lang='ko'>" +
                "<head>" +
                "    <meta charset='UTF-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }" +
                "        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }" +
                "        .header h1 { margin: 0; font-size: 24px; }" +
                "        .content { padding: 30px 20px; }" +
                "        .org-name { color: #667eea; font-weight: bold; font-size: 18px; }" +
                "        .info-box { background-color: #e8f4f8; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }" +
                "        .button { display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }" +
                "        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>✅ 기관 승인 완료</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <p>안녕하세요, <strong>WeNect</strong>입니다.</p>" +
                "            <div class='info-box'>" +
                "                <p style='margin: 0;'>기관명: <span class='org-name'>" + orgName + "</span></p>" +
                "            </div>" +
                "            <p>귀 기관의 회원가입이 <strong>승인</strong>되었습니다.</p>" +
                "            <p>이제 WeNect 플랫폼에서 기관 회원으로서 모든 서비스를 이용하실 수 있습니다.</p>" +
                "            <p>다음과 같은 기능을 사용할 수 있습니다:</p>" +
                "            <ul>" +
                "                <li>기부 프로젝트 등록 및 관리</li>" +
                "                <li>기부금 수령 및 정산</li>" +
                "                <li>기부자 관리 및 소통</li>" +
                "                <li>통계 및 리포트 확인</li>" +
                "            </ul>" +
                "            <p>WeNect와 함께 더 많은 선한 영향력을 만들어가시길 바랍니다.</p>" +
                "            <p>감사합니다.</p>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            <p>본 메일은 발신 전용입니다. 문의사항은 WeNect 고객센터를 이용해주세요.</p>" +
                "            <p>&copy; 2025 WeNect. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    /**
     * 반려 메일 HTML 템플릿
     */
    private String buildRejectionEmailTemplate(String orgName, String rejectionReason) {
        return "<!DOCTYPE html>" +
                "<html lang='ko'>" +
                "<head>" +
                "    <meta charset='UTF-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }" +
                "        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                "        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px 20px; text-align: center; }" +
                "        .header h1 { margin: 0; font-size: 24px; }" +
                "        .content { padding: 30px 20px; }" +
                "        .org-name { color: #f5576c; font-weight: bold; font-size: 18px; }" +
                "        .info-box { background-color: #fff3f3; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; border-radius: 4px; }" +
                "        .reason-box { background-color: #fef6e8; border: 1px solid #f5c85c; padding: 15px; margin: 20px 0; border-radius: 4px; }" +
                "        .reason-title { color: #d97706; font-weight: bold; margin-bottom: 10px; }" +
                "        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>❌ 기관 승인 반려</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <p>안녕하세요, <strong>WeNect</strong>입니다.</p>" +
                "            <div class='info-box'>" +
                "                <p style='margin: 0;'>기관명: <span class='org-name'>" + orgName + "</span></p>" +
                "            </div>" +
                "            <p>귀 기관의 회원가입이 <strong>반려</strong>되었습니다.</p>" +
                "            <div class='reason-box'>" +
                "                <div class='reason-title'>📝 반려 사유:</div>" +
                "                <p style='margin: 5px 0; white-space: pre-wrap;'>" + (rejectionReason != null ? rejectionReason : "반려 사유가 제공되지 않았습니다.") + "</p>" +
                "            </div>" +
                "            <p>위의 사유를 확인하시고 필요한 정보를 수정하신 후 <strong>재신청</strong>하실 수 있습니다.</p>" +
                "            <p>재신청 시 다음 사항을 확인해주세요:</p>" +
                "            <ul>" +
                "                <li>정확한 기관 정보 입력</li>" +
                "                <li>유효한 사업자등록번호 또는 고유번호</li>" +
                "                <li>요구되는 서류의 정확한 제출</li>" +
                "            </ul>" +
                "            <p>문의사항이 있으시면 언제든지 고객센터로 연락 주시기 바랍니다.</p>" +
                "            <p>감사합니다.</p>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            <p>본 메일은 발신 전용입니다. 문의사항은 WeNect 고객센터를 이용해주세요.</p>" +
                "            <p>&copy; 2025 WeNect. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}
