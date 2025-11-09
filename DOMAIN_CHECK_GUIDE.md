# 도메인 확인 가이드

## 🎯 도메인이란?

웹사이트 주소입니다. 예:
- `google.com`
- `naver.com`
- `wenect.com`
- `myproject.co.kr`

---

## ❓ 도메인 보유 여부 확인 방법

### 질문 1: 도메인을 구매하신 적이 있나요?

**도메인 구매처:**
- 가비아 (gabia.com)
- 호스팅케이알 (hosting.kr)
- Cloudflare
- GoDaddy
- Route53 (AWS)
- 기타 도메인 등록 업체

**확인 방법:**
```
위의 사이트 중 하나에 가입/구매한 적이 있나요?
→ 예: 도메인이 있습니다
→ 아니요: 도메인이 없습니다
```

---

### 질문 2: 프로젝트용 웹 주소를 만든 적이 있나요?

**예시:**
- "wenect.com 이런 주소를 만들었어요"
- "myproject.co.kr 같은 걸 샀어요"
- "도메인을 등록했어요"

→ **예: 도메인이 있습니다**

---

### 질문 3: 도메인 관리 페이지에 접속할 수 있나요?

도메인이 있다면 다음과 같은 관리 페이지가 있습니다:

**가비아 예시:**
```
my.gabia.com → 도메인 관리
→ 소유한 도메인 목록 확인
```

**Cloudflare 예시:**
```
dash.cloudflare.com → Websites
→ 등록된 도메인 확인
```

---

## 🔍 도메인 확인 방법 (있는 경우)

### 방법 1: 도메인 구매 사이트 로그인

가비아, 호스팅케이알 등에 로그인하여 확인:

```
1. 도메인 구매 사이트 접속
2. 로그인
3. "내 도메인" 또는 "도메인 관리" 메뉴
4. 보유 중인 도메인 확인
```

**확인할 정보:**
- 도메인 이름 (예: wenect.com)
- 만료일
- 네임서버 설정

---

### 방법 2: 이메일 확인

도메인을 구매하면 이메일이 옵니다:

```
제목: [가비아] 도메인 등록 완료
내용: wenect.com 도메인이 등록되었습니다.
```

이메일 검색 키워드:
- "도메인 등록"
- "domain registration"
- "wenect.com"
- "gabia"

---

## 🆕 도메인이 없는 경우

### 옵션 1: 도메인 없이 IP 주소로 접근 (무료)

**장점:**
- 비용 없음
- 즉시 사용 가능

**단점:**
- HTTPS(보안 연결) 사용 불가
- 주소가 숫자로 표시됨 (예: http://123.456.789.10)

**예시:**
```
http://123.456.789.10
```

**k8s/ingress.yaml 수정:**
```yaml
spec:
  rules:
  - http:  # host 필드를 삭제
      paths:
      - path: /
        ...
```

---

### 옵션 2: 도메인 구매 (연간 1만원~2만원)

**추천 사이트:**
- **가비아** (gabia.com) - 한국어, 한국 도메인(.co.kr, .kr)
- **Cloudflare** (cloudflare.com) - 저렴, 영어
- **Namecheap** - 저렴, 영어

**가격 예시:**
- `.com` 도메인: 연간 15,000원~20,000원
- `.co.kr` 도메인: 연간 20,000원~30,000원
- `.shop` 도메인: 연간 5,000원~10,000원

**구매 후:**
1. 도메인 이름 확인 (예: wenect.com)
2. k8s/ingress.yaml 수정
3. DNS 설정 (A 레코드 추가)

---

## 📝 k8s/ingress.yaml 수정 방법

### 경우 1: 도메인이 있는 경우 (예: wenect.com)

**3곳 수정:**

```yaml
# Line 32
- hosts:
  - wenect.com  # ← 실제 도메인으로 변경

# Line 36
- host: wenect.com  # ← 실제 도메인으로 변경
  http:
    paths:
    ...

# Line 69
- host: wenect.com  # ← 실제 도메인으로 변경
  http:
    paths:
    ...
```

---

### 경우 2: 도메인이 없는 경우 (IP만 사용)

**방법 A: host 필드 완전 삭제**

```yaml
spec:
  # tls 섹션 삭제
  rules:
  - http:  # host 필드 없음
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

**방법 B: 임시로 그대로 두기**
```yaml
# 나중에 도메인 구매 후 수정
host: wenect.yourdomain.com
```
→ 배포 후 Ingress IP 주소로 접근 가능

---

## 🎯 현재 상황 확인

### 질문에 답변해주세요:

**1. 도메인을 구매한 적이 있나요?**
- [ ] A) 네, 있어요 → 도메인 이름: _______________
- [ ] B) 아니요, 없어요 → IP 주소로 접근
- [ ] C) 모르겠어요 → 함께 확인합시다

**2. (도메인이 있다면) 어디서 구매했나요?**
- [ ] 가비아
- [ ] 호스팅케이알
- [ ] Cloudflare
- [ ] GoDaddy
- [ ] 기타: _______________

**3. 도메인 관리 페이지에 로그인할 수 있나요?**
- [ ] 네
- [ ] 아니요
- [ ] 모르겠어요

---

## 💡 추천 방안

### 상황 A: "도메인이 있어요" (예: wenect.com)
```yaml
# k8s/ingress.yaml 수정
host: wenect.com
```

**다음 단계:**
1. k8s/ingress.yaml 수정
2. Kubernetes 배포
3. Ingress IP 확인
4. 도메인 DNS 설정 (A 레코드)
5. https://wenect.com 접속

---

### 상황 B: "도메인이 없어요"

**옵션 1: IP로 접근 (무료, 즉시)**
```
http://123.456.789.10
```
- HTTPS 없음
- 숫자 주소

**옵션 2: 도메인 구매 (1~2만원/년)**
1. 가비아에서 도메인 구매
2. k8s/ingress.yaml 수정
3. DNS 설정
4. https://wenect.com 접속

---

## 🚀 빠른 결정 가이드

### "지금 바로 배포하고 싶어요"
→ **도메인 없이 IP로 접근**
```yaml
# k8s/ingress.yaml에서 host 필드 삭제
# 배포 후 IP로 접근
```

### "제대로 된 주소로 하고 싶어요"
→ **도메인 구매**
```
1. 가비아에서 도메인 구매 (10분)
2. k8s/ingress.yaml 수정
3. 배포 후 DNS 설정
```

---

## 📞 다음 단계

### 답변 A: "도메인 있어요, wenect.com입니다"
→ k8s/ingress.yaml을 바로 수정해드립니다!

### 답변 B: "도메인 없어요, IP로 접근할게요"
→ k8s/ingress.yaml에서 host 필드를 제거해드립니다!

### 답변 C: "도메인 구매하고 싶어요"
→ 구매 방법과 설정 방법을 안내해드립니다!

### 답변 D: "있는지 모르겠어요"
→ 함께 확인해봅시다!

어떤 상황이신가요? 😊
