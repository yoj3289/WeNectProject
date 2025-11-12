package com.wenect.donation_paltform.global.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 카카오페이 API 설정 프로퍼티
 * application-pay.yml 파일의 kakaopay 설정을 자동으로 바인딩
 */
@Component
@ConfigurationProperties(prefix = "kakaopay")
@Getter
@Setter
public class KakaoPayProperties {

    /**
     * 카카오페이 Admin Key (Secret Key)
     * 카카오 개발자 센터에서 발급받은 키
     */
    private String secretKey;

    /**
     * 가맹점 코드 (CID)
     * 테스트: TC0ONETIME
     * 운영: 카카오페이에서 발급받은 실제 CID
     */
    private String cid;

    /**
     * 카카오페이 API 엔드포인트
     */
    private String readyUrl;
    private String approveUrl;
    private String cancelApiUrl;  // API 취소용

    /**
     * 결제 후 리다이렉트 URL
     */
    private String approvalUrl;   // 결제 성공 시
    private String cancelUrl;     // 결제 취소 시 리다이렉트
    private String failUrl;       // 결제 실패 시
}
