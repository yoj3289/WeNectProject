# 빠른 설정 가이드

현재 가지고 계신 정보로 배포를 시작하는 방법입니다.

---

## 📋 현재 보유 정보

✅ Jenkins 주소, 아이디, 비밀번호
✅ Oracle Cloud Public/Private Key

---

## 🎯 선택하세요

### 옵션 1: 간단하게 로컬에서 먼저 테스트 (5분) 🚀

**지금 바로 실행 가능!**

```bash
# Docker Desktop이 실행 중인지 확인하고
docker-compose up -d

# 브라우저에서 접속
http://localhost
```

**같은 WiFi 내 스마트폰 접속**:
```bash
# Windows에서 IP 확인
ipconfig

# 스마트폰에서 접속
http://192.168.x.x
```

---

### 옵션 2: Oracle Cloud + Kubernetes 배포 (1-2시간) ⚙️

**필요한 추가 정보**를 확인해주세요:

#### 📌 Step 1: Oracle Cloud 정보 확인

Oracle Cloud Console에 로그인하여 다음을 확인:

```
1. Tenancy 정보
   → 프로필 아이콘 → Tenancy 클릭
   → Object Storage Namespace 복사 (예: axabcdefgh)
   → Region 확인 (예: ap-seoul-1)

2. OKE 클러스터 확인
   → 메뉴 → Developer Services → Kubernetes Clusters
   → 클러스터가 있나요?

3. Auth Token 생성 (Docker 로그인용)
   → 프로필 → My profile → Auth tokens
   → Generate token → 복사하여 저장
```

#### 📌 Step 2: 도메인 확인

외부 접근을 위해 도메인이 필요합니다:

- **도메인 있음**: wenect.com 같은 도메인
- **도메인 없음**: IP 주소로 접근 (HTTPS 없음)

#### 📌 Step 3: 정보 입력

[DEPLOYMENT_INFO_REQUIRED.md](./DEPLOYMENT_INFO_REQUIRED.md) 파일을 열어서 확인한 정보를 기입해주세요.

---

## 💬 지금 알려주실 수 있는 것

다음 질문에 답변해주시면 바로 설정을 도와드릴 수 있습니다:

### 질문 1: OKE 클러스터
**"Oracle Cloud에 Kubernetes 클러스터가 이미 만들어져 있나요?"**

- A) 네, 있어요 → 클러스터 이름을 알려주세요
- B) 아니요, 없어요 → 새로 만들어야 해요
- C) 모르겠어요 → 같이 확인해봐요

### 질문 2: 도메인
**"웹사이트 도메인(주소)을 가지고 계신가요?"**

- A) 네, 있어요 → 도메인 이름을 알려주세요 (예: wenect.com)
- B) 아니요, 없어요 → IP 주소로 접근할게요
- C) 구매해야 해요 → 가비아, Cloudflare 등에서 구매 가능

### 질문 3: 배포 우선순위
**"지금 무엇을 먼저 하고 싶으신가요?"**

- A) 로컬에서 먼저 테스트해보기 → `docker-compose up -d`
- B) 바로 Oracle Cloud에 배포하기 → 추가 정보 확인 필요
- C) Jenkins 설정부터 하기 → Jenkins 접속 테스트

---

## 🔧 지금 바로 할 수 있는 것

### 1. Git 커밋 (민감 정보 제외)
```bash
git add .
git status  # .env가 없는지 확인
git commit -m "feat: Add deployment configuration"
git push origin main
```

### 2. 로컬 테스트
```bash
docker-compose up -d
```

### 3. Oracle Cloud 정보 확인
[DEPLOYMENT_INFO_REQUIRED.md](./DEPLOYMENT_INFO_REQUIRED.md) 체크리스트 작성

---

## 📞 다음 단계

아래 중 현재 상황에 맞는 것을 알려주세요:

**상황 A**: "로컬 테스트부터 하고 싶어요"
→ 지금 바로 `docker-compose up -d` 실행

**상황 B**: "Oracle Cloud 정보는 다 있어요. 배포하고 싶어요"
→ 다음 정보 알려주세요:
- Tenancy Namespace
- Region
- OKE 클러스터 이름 (있다면)
- 도메인 (있다면)

**상황 C**: "Oracle Cloud 정보를 어떻게 확인하는지 모르겠어요"
→ 화면 공유하면서 같이 확인할 수 있어요

**상황 D**: "Jenkins만 먼저 설정하고 싶어요"
→ Jenkins URL 알려주시면 접속 테스트 도와드릴게요

알려주시면 그에 맞게 진행하겠습니다! 😊
