package com.wenect.donation_paltform.domain.expense.service;

import com.wenect.donation_paltform.domain.expense.entity.Expense;
import com.wenect.donation_paltform.domain.organization.entity.Organization;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ExpenseEmailService {

    private final JavaMailSender mailSender;

    /**
     * 출금 요청 접수 알림 메일 발송
     */
    public void sendWithdrawalRequestEmail(Expense expense, Organization organization) {
        try {
            String userEmail = organization.getUser().getEmail();
            String orgName = organization.getOrgName();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("wenect.noreply@gmail.com");
            helper.setTo(userEmail);
            helper.setSubject("[WeNect] 출금 요청 접수");

            String htmlContent = buildWithdrawalRequestEmailTemplate(orgName, expense);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("출금 요청 접수 메일 발송에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 출금 승인 완료 알림 메일 발송
     */
    public void sendWithdrawalApprovalEmail(Expense expense, Organization organization) {
        try {
            String userEmail = organization.getUser().getEmail();
            String orgName = organization.getOrgName();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("wenect.noreply@gmail.com");
            helper.setTo(userEmail);
            helper.setSubject("[WeNect] 출금 승인 완료");

            String htmlContent = buildWithdrawalApprovalEmailTemplate(orgName, expense);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("출금 승인 완료 메일 발송에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 출금 반려 알림 메일 발송
     */
    public void sendWithdrawalRejectionEmail(Expense expense, Organization organization) {
        try {
            String userEmail = organization.getUser().getEmail();
            String orgName = organization.getOrgName();
            String rejectionReason = expense.getRejectionReason();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("wenect.noreply@gmail.com");
            helper.setTo(userEmail);
            helper.setSubject("[WeNect] 출금 반려");

            String htmlContent = buildWithdrawalRejectionEmailTemplate(orgName, expense, rejectionReason);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("출금 반려 메일 발송에 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 출금 요청 접수 메일 HTML 템플릿
     */
    private String buildWithdrawalRequestEmailTemplate(String orgName, Expense expense) {
        String formattedAmount = formatCurrency(expense.getAmount());

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
                "            <h1>📝 출금 요청 접수</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <p>안녕하세요, <strong>WeNect</strong>입니다.</p>" +
                "            <div class='info-box'>" +
                "                <p style='margin: 0;'>기관명: <span class='org-name'>" + orgName + "</span></p>" +
                "            </div>" +
                "            <p>귀 기관의 <strong>출금 요청</strong>이 접수되었습니다.</p>" +
                "            <p><strong>출금 정보:</strong></p>" +
                "            <ul>" +
                "                <li>출금 금액: " + formattedAmount + "</li>" +
                "                <li>카테고리: " + expense.getCategory() + "</li>" +
                "                <li>설명: " + expense.getDescription() + "</li>" +
                "                <li>지출 일자: " + expense.getExpenseDate() + "</li>" +
                "            </ul>" +
                "            <p>관리자 검토 후 승인/반려 결과를 안내드리겠습니다.</p>" +
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
     * 출금 승인 완료 메일 HTML 템플릿
     */
    private String buildWithdrawalApprovalEmailTemplate(String orgName, Expense expense) {
        String formattedAmount = formatCurrency(expense.getAmount());

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
                "            <h1>✅ 출금 승인 완료</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <p>안녕하세요, <strong>WeNect</strong>입니다.</p>" +
                "            <div class='info-box'>" +
                "                <p style='margin: 0;'>기관명: <span class='org-name'>" + orgName + "</span></p>" +
                "            </div>" +
                "            <p>귀 기관의 <strong>출금 요청</strong>이 승인되었습니다.</p>" +
                "            <p><strong>출금 정보:</strong></p>" +
                "            <ul>" +
                "                <li>출금 금액: " + formattedAmount + "</li>" +
                "                <li>카테고리: " + expense.getCategory() + "</li>" +
                "                <li>설명: " + expense.getDescription() + "</li>" +
                "                <li>지출 일자: " + expense.getExpenseDate() + "</li>" +
                "            </ul>" +
                "            <p>저금통에서 해당 금액이 차감되었습니다.</p>" +
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
     * 출금 반려 메일 HTML 템플릿
     */
    private String buildWithdrawalRejectionEmailTemplate(String orgName, Expense expense, String rejectionReason) {
        String formattedAmount = formatCurrency(expense.getAmount());

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
                "            <h1>❌ 출금 반려</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <p>안녕하세요, <strong>WeNect</strong>입니다.</p>" +
                "            <div class='info-box'>" +
                "                <p style='margin: 0;'>기관명: <span class='org-name'>" + orgName + "</span></p>" +
                "            </div>" +
                "            <p>귀 기관의 <strong>출금 요청</strong>이 반려되었습니다.</p>" +
                "            <p><strong>출금 정보:</strong></p>" +
                "            <ul>" +
                "                <li>출금 금액: " + formattedAmount + "</li>" +
                "                <li>카테고리: " + expense.getCategory() + "</li>" +
                "                <li>설명: " + expense.getDescription() + "</li>" +
                "                <li>지출 일자: " + expense.getExpenseDate() + "</li>" +
                "            </ul>" +
                "            <div class='reason-box'>" +
                "                <div class='reason-title'>📝 반려 사유:</div>" +
                "                <p style='margin: 5px 0; white-space: pre-wrap;'>" + (rejectionReason != null ? rejectionReason : "반려 사유가 제공되지 않았습니다.") + "</p>" +
                "            </div>" +
                "            <p>위의 사유를 확인하시고 필요한 정보를 수정하신 후 <strong>재신청</strong>하실 수 있습니다.</p>" +
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

    /**
     * 금액 포맷팅 (원 단위)
     */
    private String formatCurrency(java.math.BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getNumberInstance(Locale.KOREA);
        return formatter.format(amount) + "원";
    }
}
