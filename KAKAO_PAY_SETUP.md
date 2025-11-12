# 카카오페이 API 설정 가이드

블로그 참고: https://myste-leee.tistory.com/272

## 1. 설정 파일 준비

### 1.1. application-pay.yml 생성

```bash
cd backend/src/main/resources
cp application-pay.yml.example application-pay.yml
```

### 1.2. 카카오페이 Admin Key 발급

1. [카카오 개발자 센터](https://developers.kakao.com/) 접속
2. 앱 생성 또는 기존 앱 선택
3. **앱 설정 > 앱 키** 메뉴에서 `Admin 키` 복사
4. `application-pay.yml` 파일에서 `secret-key`에 붙여넣기

```yaml
kakaopay:
  secret-key: YOUR_ADMIN_KEY_HERE  # 여기에 Admin Key 입력
  cid: TC0ONETIME
```

## 2. 프로젝트 구조

```
backend/src/main/java/com/wenect/donation_paltform/
├── global/config/properties/
│   └── KakaoPayProperties.java           # 설정 관리
├── domain/payment/
│   ├── dto/
│   │   ├── KakaoPayReadyRequest.java     # 결제 준비 요청
│   │   ├── KakaoPayReadyResponse.java    # 결제 준비 응답
│   │   ├── KakaoPayApproveRequest.java   # 결제 승인 요청
│   │   └── KakaoPayApproveResponse.java  # 결제 승인 응답
│   ├── service/
│   │   └── KakaoPayService.java          # 카카오페이 API 호출
│   └── controller/
│       └── KakaoPayController.java       # REST API 엔드포인트
```

## 3. API 사용법

### 3.1. 결제 준비 (Ready)

**요청**
```http
POST /api/payments/kakao/ready
Content-Type: application/x-www-form-urlencoded

itemName=기부금&totalAmount=10000&userId=user123&orderId=order_001
```

**응답**
```json
{
  "tid": "T1234567890123456789",
  "next_redirect_pc_url": "https://online-pay.kakao.com/mockup/...",
  "created_at": "2024-01-01T00:00:00"
}
```

**프론트엔드 처리**
```javascript
// 결제 준비 API 호출
const response = await fetch('/api/payments/kakao/ready', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    itemName: '기부금',
    totalAmount: 10000,
    userId: 'user123',
    orderId: 'order_001'
  })
});

const data = await response.json();

// 카카오페이 결제 페이지로 리다이렉트
window.location.href = data.next_redirect_pc_url;
```

### 3.2. 결제 승인 (Approve)

사용자가 카카오페이에서 결제를 완료하면 `approval-url`로 리다이렉트됩니다.

**리다이렉트 URL 예시**
```
http://localhost:3000/payment/success?pg_token=ABC123&orderId=order_001
```

**백엔드에서 자동 처리**
```http
GET /api/payments/kakao/success?pg_token=ABC123&orderId=order_001
```

**응답**
```json
{
  "aid": "A1234567890123456789",
  "tid": "T1234567890123456789",
  "cid": "TC0ONETIME",
  "partner_order_id": "order_001",
  "partner_user_id": "user123",
  "payment_method_type": "MONEY",
  "amount": {
    "total": 10000,
    "tax_free": 0,
    "vat": 909,
    "point": 0,
    "discount": 0
  },
  "item_name": "기부금",
  "approved_at": "2024-01-01T00:00:00"
}
```

## 4. 결제 흐름

```
[사용자] --1--> [프론트엔드] --2--> [백엔드: /ready]
                                         |
                                         v
                                    [카카오페이 API]
                                         |
                                         v
[사용자] <--3-- [카카오페이 결제 페이지]
   |
   v (결제 완료)
[프론트엔드: /payment/success] --4--> [백엔드: /success]
                                         |
                                         v
                                    [카카오페이 API: /approve]
                                         |
                                         v
                                    [결제 완료 처리]
```

## 5. 주의사항

### 5.1. Authorization 헤더
```java
// ✅ 올바른 형식 (SECRET_KEY 뒤에 공백 필수!)
"Authorization: SECRET_KEY your_admin_key_here"

// ❌ 잘못된 형식
"Authorization: your_admin_key_here"
```

### 5.2. MultiValueMap 사용 금지
블로그에서 강조한 대로, **MultiValueMap을 사용하면 괄호[]가 추가되어 API 호출이 실패**합니다.

```java
// ✅ 일반 객체 사용 (권장)
KakaoPayReadyRequest request = KakaoPayReadyRequest.builder()
    .cid("TC0ONETIME")
    .partner_order_id("order_001")
    .build();

// ❌ MultiValueMap 사용 금지!
MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
params.add("cid", "TC0ONETIME");
```

### 5.3. TID 저장
결제 준비 시 받은 `tid`는 **결제 승인 시 필요**하므로 반드시 저장해야 합니다.

```java
// TODO: 구현 필요
// Redis 또는 DB에 저장
// Key: orderId, Value: { tid, userId, itemName, amount }
```

## 6. 테스트

### 6.1. 로컬 테스트
```bash
# 백엔드 실행
cd backend
./gradlew bootRun

# 결제 준비 API 테스트
curl -X POST http://localhost:8080/api/payments/kakao/ready \
  -d "itemName=테스트기부&totalAmount=10000&userId=test&orderId=test001"
```

### 6.2. 테스트 카드
카카오페이 테스트 환경에서는 실제 결제가 발생하지 않습니다.
- 카카오페이머니, 카드 등 모든 결제 수단 테스트 가능
- 실제 금액이 청구되지 않음

## 7. 운영 배포 전 체크리스트

- [ ] `application-pay.yml`이 `.gitignore`에 추가되어 있는지 확인
- [ ] 운영 환경에서 실제 Admin Key로 교체
- [ ] CID를 테스트용(TC0ONETIME)에서 실제 발급받은 CID로 변경
- [ ] 리다이렉트 URL을 운영 도메인으로 변경
- [ ] TID 저장/조회 로직 구현 (Redis 또는 DB)
- [ ] 결제 완료 후 DB 저장 로직 구현

## 8. 문제 해결

### 8.1. "Invalid Authorization" 오류
- Admin Key가 올바른지 확인
- `SECRET_KEY ` 접두사에 공백이 있는지 확인

### 8.2. "Invalid Parameter" 오류
- 필수 파라미터가 모두 전달되었는지 확인
- MultiValueMap 대신 일반 객체를 사용하는지 확인

### 8.3. TID를 찾을 수 없음
- 결제 준비 시 받은 TID를 저장하는 로직 구현 필요

## 참고 자료

- [카카오페이 개발 가이드](https://developers.kakao.com/docs/latest/ko/kakaopay/common)
- [블로그 참고](https://myste-leee.tistory.com/272)
