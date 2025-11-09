# 보유 정보 체크리스트

배포에 필요한 정보와 현재 보유 상태를 정리합니다.

---

## ✅ 현재 보유 중인 정보

### 1. Jenkins ✅
- [x] Jenkins 주소 (URL)
- [x] Jenkins 아이디
- [x] Jenkins 비밀번호

### 2. Oracle Cloud ✅
- [x] Public Key
- [x] Private Key

### 3. Database ✅
- [x] DB 주소
- [x] DB 비밀번호

**매우 좋습니다! 핵심 정보는 다 있습니다!** 🎉

---

## ❓ 추가로 필요한 정보

배포를 완료하려면 아래 정보가 더 필요합니다:

### 🔴 필수 정보 (Oracle Cloud)

#### A. Tenancy Namespace
**이것이 무엇인가요?**
- Docker 이미지를 저장할 Oracle Container Registry 주소의 일부입니다.

**확인 방법:**
```
1. Oracle Cloud Console 접속
2. 우측 상단 프로필 아이콘 클릭
3. "Tenancy: <이름>" 클릭
4. "Object Storage Namespace" 복사
```

**예시:**
```
axabcdefgh (보통 10자 정도의 영문/숫자 조합)
```

**이 정보가 필요한 이유:**
- Jenkinsfile에서 Docker 이미지 경로 설정
- `ap-seoul-1.ocir.io/[여기]/wenect-backend:latest`

---

#### B. Region (리전)
**이것이 무엇인가요?**
- Oracle Cloud 리소스가 위치한 지역입니다.

**확인 방법:**
```
1. Oracle Cloud Console 접속
2. 우측 상단 리전 선택기 확인
3. 또는 프로필 → Tenancy → "Home Region"
```

**예시:**
```
ap-seoul-1      (서울)
ap-chuncheon-1  (춘천)
us-ashburn-1    (미국 버지니아)
ap-tokyo-1      (도쿄)
```

**이 정보가 필요한 이유:**
- Docker Registry 주소: `[리전].ocir.io`
- 예: `ap-seoul-1.ocir.io`

---

#### C. Auth Token (Docker 인증용)
**이것이 무엇인가요?**
- Docker가 Oracle Container Registry에 이미지를 push할 때 사용하는 비밀번호입니다.

**생성 방법:**
```
1. Oracle Cloud Console 접속
2. 우측 상단 프로필 아이콘 클릭
3. "My profile" 클릭
4. 좌측 메뉴에서 "Auth tokens" 클릭
5. "Generate token" 버튼 클릭
6. Description 입력 (예: "docker-login")
7. 생성된 토큰 복사 (⚠️ 한 번만 보이므로 반드시 복사!)
```

**예시:**
```
abcd1234efgh5678ijkl (약 40자 정도의 문자열)
```

**⚠️ 주의:**
- 생성 후 한 번만 표시됩니다
- 안전한 곳에 보관하세요
- 잃어버리면 새로 생성해야 합니다

---

### 🟡 선택 정보

#### D. Kubernetes 클러스터 (OKE)
**확인 방법:**
```
1. Oracle Cloud Console
2. 좌측 메뉴 → Developer Services → Kubernetes Clusters (OKE)
3. 클러스터가 있는지 확인
```

**상태:**
- [ ] 클러스터가 이미 있음 → 클러스터 이름: _______________
- [ ] 클러스터가 없음 → 새로 생성 필요 (15분 소요)

---

#### E. 도메인
**상태:**
- [ ] 도메인 있음 → 도메인 이름: _______________
- [ ] 도메인 없음 → IP 주소로 접근 (HTTPS 불가)

---

## 📊 정보 입력표

아래 표에 확인한 정보를 기입해주세요:

| 항목 | 값 | 확인 |
|------|-----|------|
| **Jenkins** | | |
| Jenkins URL | _____________ | [x] |
| Jenkins 아이디 | _____________ | [x] |
| Jenkins 비밀번호 | ************ | [x] |
| **Oracle Cloud** | | |
| Public Key | 있음 | [x] |
| Private Key | 있음 | [x] |
| Tenancy Namespace | _____________ | [ ] |
| Region | _____________ | [ ] |
| Auth Token | _____________ | [ ] |
| **Database** | | |
| DB 주소 | _____________ | [x] |
| DB 포트 | _____________ (보통 3306) | [ ] |
| DB 이름 | _____________ (보통 mydb) | [ ] |
| DB 사용자명 | _____________ (보통 root) | [ ] |
| DB 비밀번호 | ************ | [x] |
| **Kubernetes** | | |
| OKE 클러스터 존재 | [ ] 예 [ ] 아니오 | [ ] |
| 클러스터 이름 | _____________ | [ ] |
| **도메인** | | |
| 도메인 보유 | [ ] 예 [ ] 아니오 | [ ] |
| 도메인 이름 | _____________ | [ ] |

---

## 🎯 지금 알려주실 수 있는 정보

다음 질문에 답변해주세요:

### 질문 1: Oracle Cloud Tenancy Namespace
```
Oracle Cloud Console → 프로필 → Tenancy → Object Storage Namespace
```
**답변:** _______________

### 질문 2: Oracle Cloud Region
```
Oracle Cloud Console → 우측 상단 리전 표시
```
**답변:** _______________ (예: ap-seoul-1)

### 질문 3: Database 상세 정보
**DB 주소:** _______________
**DB 포트:** _______________ (기본값: 3306)
**DB 이름:** _______________ (기본값: mydb)
**DB 사용자명:** _______________ (기본값: root)
**DB 비밀번호:** (이미 보유 중) ✅

### 질문 4: Kubernetes 클러스터
**OKE 클러스터가 있나요?**
- [ ] A) 네, 있어요 → 클러스터 이름: _______________
- [ ] B) 아니요, 없어요 → 새로 만들어야 해요

### 질문 5: 도메인
**도메인이 있나요?**
- [ ] A) 네, 있어요 → 도메인: _______________
- [ ] B) 아니요, 없어요 → IP로 접근할게요

---

## 🚀 다음 단계

### 옵션 A: 정보를 다 알고 있어요
위의 표를 작성해서 알려주시면:
1. 설정 파일을 바로 수정해드립니다
2. 배포 명령어를 제공합니다
3. 30분 안에 배포 완료 가능!

### 옵션 B: 정보를 확인하는 방법을 모르겠어요
하나씩 같이 확인하겠습니다:
1. Oracle Cloud Console에 로그인
2. 화면 안내에 따라 정보 확인
3. 확인한 정보로 설정 파일 수정

### 옵션 C: 일단 로컬에서 테스트하고 싶어요
```bash
# 외부 DB 사용
docker-compose up -d
```

DB 정보를 `.env` 파일에 추가하여 외부 DB 연결 가능합니다.

---

## 💬 지금 답변해주세요

다음 중 현재 상황을 선택해주세요:

**A)** "정보를 다 알고 있어요. 알려드릴게요"
→ 위의 표를 작성해서 알려주세요

**B)** "Oracle Cloud에서 정보를 어떻게 확인하는지 모르겠어요"
→ 단계별로 같이 확인하겠습니다

**C)** "로컬에서 외부 DB로 먼저 테스트하고 싶어요"
→ DB 정보를 알려주시면 .env 파일을 수정해드립니다

**D)** "Tenancy Namespace와 Region만 알려드릴게요"
→ 그것만으로도 많은 설정이 가능합니다!

어떤 방식으로 진행하시겠어요? 😊
