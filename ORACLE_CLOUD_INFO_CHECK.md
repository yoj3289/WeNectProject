# Oracle Cloud 정보 확인 방법

## 🎯 목표

Jenkinsfile 수정을 위해 다음 2가지 정보를 확인합니다:
1. **DOCKER_REGISTRY** (Region - 리전)
2. **DOCKER_NAMESPACE** (Tenancy Namespace - 테넌시 네임스페이스)

---

## 📍 방법 1: Oracle Cloud Console 웹에서 확인 (가장 쉬움)

### Step 1: Oracle Cloud Console 로그인

1. 웹 브라우저에서 접속: https://cloud.oracle.com
2. 로그인

### Step 2: Region (리전) 확인

**위치: 화면 우측 상단**

```
┌─────────────────────────────────────────┐
│  Oracle Cloud    [Region] 🔽  [프로필]  │
│                   ↑↑↑↑↑↑                │
│                 여기 확인!               │
└─────────────────────────────────────────┘
```

**예시 화면:**
```
South Korea Central (Seoul)        → ap-seoul-1
South Korea North (Chuncheon)      → ap-chuncheon-1
Japan East (Tokyo)                 → ap-tokyo-1
```

**→ 표시된 리전 이름을 아래 표에서 찾으세요:**

| 화면에 표시되는 이름 | Region 코드 | DOCKER_REGISTRY |
|---------------------|-------------|-----------------|
| South Korea Central (Seoul) | ap-seoul-1 | ap-seoul-1.ocir.io |
| South Korea North (Chuncheon) | ap-chuncheon-1 | ap-chuncheon-1.ocir.io |
| Japan East (Tokyo) | ap-tokyo-1 | ap-tokyo-1.ocir.io |
| Japan Central (Osaka) | ap-osaka-1 | ap-osaka-1.ocir.io |
| India West (Mumbai) | ap-mumbai-1 | ap-mumbai-1.ocir.io |
| Singapore (Singapore) | ap-singapore-1 | ap-singapore-1.ocir.io |
| Australia East (Sydney) | ap-sydney-1 | ap-sydney-1.ocir.io |
| US East (Ashburn) | us-ashburn-1 | us-ashburn-1.ocir.io |

### Step 3: Tenancy Namespace 확인

**위치: 프로필 메뉴**

```
1. 우측 상단 프로필 아이콘 클릭 (사람 모양)
2. "Tenancy: <이름>" 클릭
```

**화면 예시:**
```
┌────────────────────────────┐
│ 프로필 메뉴                │
├────────────────────────────┤
│ My profile                 │
│ Tenancy: mycompany      ←─ 클릭!
│ Sign out                   │
└────────────────────────────┘
```

**3. Tenancy 정보 페이지에서 찾기:**

```
Tenancy Information
┌─────────────────────────────────────────┐
│ Name: mycompany                         │
│ OCID: ocid1.tenancy.oc1..aaaaa...       │
│ Home Region: ap-seoul-1                 │
│ ...                                     │
│ Object Storage Settings                 │
│ ┌─────────────────────────────────────┐ │
│ │ Object Storage Namespace            │ │
│ │ axabcdefgh                  [복사]  │ │ ← 여기!
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**→ "Object Storage Namespace" 값을 복사하세요!**

---

## 📍 방법 2: OCI CLI로 확인 (Ubuntu 서버에서)

Ubuntu 서버에 SSH 접속되어 있다면, 명령어로도 확인 가능합니다.

### OCI CLI 설치 여부 확인

```bash
oci --version
```

### 설치되어 있다면:

#### Region 확인
```bash
oci iam region-subscription list
```

출력 예시:
```json
{
  "data": [
    {
      "region-name": "ap-seoul-1",
      "is-home-region": true,
      "status": "READY"
    }
  ]
}
```

#### Tenancy Namespace 확인
```bash
oci os ns get
```

출력 예시:
```json
{
  "data": "axabcdefgh"
}
```

### OCI CLI가 없다면:

**설치 방법:**
```bash
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
```

**설정:**
```bash
oci setup config
```

---

## 📍 방법 3: kubeconfig 파일에서 확인 (이미 OKE 사용 중이라면)

```bash
# kubeconfig 파일 확인
cat ~/.kube/config | grep server

# 출력 예시:
# server: https://123.456.789.10:6443
# 여기서 리전을 유추할 수 있습니다
```

---

## ✅ 확인 결과 기입

확인한 정보를 여기에 적어주세요:

### 1. Region (리전)
**확인한 값:** _______________

**예시:**
- South Korea Central (Seoul) → `ap-seoul-1`
- Japan East (Tokyo) → `ap-tokyo-1`

**→ DOCKER_REGISTRY 값:**
```
ap-seoul-1.ocir.io  (서울인 경우)
```

### 2. Tenancy Namespace
**확인한 값:** _______________

**예시:**
- Object Storage Namespace: `axabcdefgh`

**→ DOCKER_NAMESPACE 값:**
```
axabcdefgh/wenect
```

---

## 🎯 Jenkinsfile 수정 예시

### 확인한 정보:
- Region: `ap-seoul-1` (서울)
- Tenancy Namespace: `axabcdefgh`

### Jenkinsfile 수정:

```groovy
pipeline {
    agent any

    environment {
        // Docker Registry 설정 (Oracle Container Registry)
        DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'          // ✅ 서울 리전
        DOCKER_NAMESPACE = 'axabcdefgh/wenect'          // ✅ 실제 Namespace

        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'

        // 이미지 이름
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/wenect-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/wenect-frontend"

        // Kubernetes 설정
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
        K8S_NAMESPACE = 'wenect'
    }

    stages {
        ...
    }
}
```

---

## 🚀 빠른 확인 체크리스트

- [ ] Oracle Cloud Console 로그인 완료
- [ ] 우측 상단에서 Region 확인 (예: Seoul)
- [ ] Region 코드 확인 (예: ap-seoul-1)
- [ ] 프로필 → Tenancy 클릭
- [ ] Object Storage Namespace 복사 (예: axabcdefgh)
- [ ] DOCKER_REGISTRY 값 작성: _______________.ocir.io
- [ ] DOCKER_NAMESPACE 값 작성: _______________/wenect

---

## 💡 확인이 어려우신가요?

### 옵션 1: 스크린샷 공유
Oracle Cloud Console 화면을 캡처해서 보여주시면 함께 확인할 수 있습니다.

### 옵션 2: 현재 리전만 확인
"현재 Seoul 리전을 사용하고 있어요" → `ap-seoul-1.ocir.io`

### 옵션 3: OCI CLI로 확인
Ubuntu 서버에서:
```bash
# 1. OCI CLI 설치 확인
oci --version

# 2. Namespace 확인
oci os ns get

# 3. Region 확인
oci iam region-subscription list
```

---

## 📞 다음 단계

### 정보를 확인하셨다면:

**예시:**
```
Region: ap-seoul-1
Tenancy Namespace: axabcdefgh
```

이렇게 알려주시면:
1. Jenkinsfile을 바로 수정해드립니다
2. k8s/backend-deployment.yaml 수정
3. k8s/frontend-deployment.yaml 수정
4. k8s/ingress.yaml 수정 (도메인 정보도 있다면)

---

## 🎓 참고: 왜 이 정보가 필요한가요?

### DOCKER_REGISTRY (Region)
- Docker 이미지를 저장할 Oracle Container Registry의 위치
- 각 리전마다 별도의 Registry가 있습니다
- 예: `ap-seoul-1.ocir.io`

### DOCKER_NAMESPACE (Tenancy Namespace)
- 여러분의 Oracle Cloud 계정을 식별하는 고유 ID
- Docker 이미지 경로에 포함됩니다
- 예: `ap-seoul-1.ocir.io/axabcdefgh/wenect-backend:latest`
       ^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^ ^^^^^^^^^^^^^^
           Registry          Namespace   이미지 이름

---

## ✅ 요약

1. **Oracle Cloud Console** 접속
2. **우측 상단 Region** 확인 → `ap-seoul-1` 같은 코드 확인
3. **프로필 → Tenancy** 클릭 → Object Storage Namespace 복사
4. 확인한 정보 알려주시면 → 파일 수정 도와드립니다!

정보를 확인하시면 바로 알려주세요! 😊
