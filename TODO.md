# 배포를 위해 수정해야 할 항목

이 문서는 실제 배포 전에 **반드시 수정해야 하는** 설정들을 정리한 체크리스트입니다.

---

## 🔴 필수 수정 항목 (배포 전 반드시 수정!)

### 1. Secret 정보 수정 (k8s/secret.yaml)
**파일**: `k8s/secret.yaml`

```yaml
# 현재 (템플릿)
DB_PASSWORD: "your-database-password-here"
JWT_SECRET: "your-jwt-secret-key-change-this-in-production"

# 수정 필요 ↓
DB_PASSWORD: "실제로 사용할 강력한 DB 비밀번호"
JWT_SECRET: "최소 256비트 이상의 강력한 JWT 시크릿 키"
```

**주의**: 프로덕션 환경에서는 이 파일을 Git에 커밋하지 말고, kubectl 명령어로 직접 생성하세요!

```bash
kubectl create secret generic wenect-secret \
  --from-literal=DB_PASSWORD='실제비밀번호' \
  --from-literal=JWT_SECRET='실제JWT시크릿' \
  -n wenect
```

---

### 2. 도메인 설정 (k8s/ingress.yaml)
**파일**: `k8s/ingress.yaml`

```yaml
# 현재 (템플릿)
host: wenect.yourdomain.com

# 수정 필요 ↓
host: wenect.example.com  # 실제로 구입한 도메인
```

**3곳 수정 필요**:
- Line 20: `- wenect.yourdomain.com`
- Line 24: `host: wenect.yourdomain.com`
- Line 54: `host: wenect.yourdomain.com`

---

### 3. Docker Registry 설정 (Jenkinsfile)
**파일**: `Jenkinsfile`

```groovy
// 현재 (템플릿)
DOCKER_REGISTRY = 'your-region.ocir.io'
DOCKER_NAMESPACE = 'your-tenancy-namespace'

// 수정 필요 ↓
DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'  // 실제 Oracle Cloud 리전
DOCKER_NAMESPACE = 'axabcdefgh/wenect'  // 실제 테넌시 네임스페이스
```

**확인 방법**:
- Oracle Cloud Console → Identity → Tenancy Details → Object Storage Namespace

---

### 4. Kubernetes 매니페스트에 이미지 경로 수정
**파일**: `k8s/backend-deployment.yaml`, `k8s/frontend-deployment.yaml`

```yaml
# 현재 (템플릿)
image: your-docker-registry/wenect-backend:latest

# 수정 필요 ↓
image: ap-seoul-1.ocir.io/axabcdefgh/wenect-backend:latest
```

---

### 5. cert-manager 이메일 설정 (HTTPS SSL용)
**위치**: DEPLOYMENT.md 참고 → Let's Encrypt Issuer 생성 부분

```yaml
email: your-email@example.com  # 실제 이메일로 변경
```

---

## 🟡 선택 사항 (환경에 따라 수정)

### 6. 스토리지 클래스 (다른 클라우드 사용 시)
**파일**: `k8s/mysql-deployment.yaml`

```yaml
storageClassName: oci-bv  # Oracle Cloud
# AWS EKS: gp2
# GCP GKE: standard
# Azure AKS: default
```

---

### 7. 리소스 제한 조정 (필요 시)
**파일**: `k8s/backend-deployment.yaml`, `k8s/frontend-deployment.yaml`

```yaml
resources:
  requests:
    memory: "512Mi"  # 최소 메모리
    cpu: "250m"      # 최소 CPU
  limits:
    memory: "1Gi"    # 최대 메모리
    cpu: "500m"      # 최대 CPU
```

---

### 8. MySQL 저장소 크기 조정
**파일**: `k8s/mysql-deployment.yaml`

```yaml
resources:
  requests:
    storage: 10Gi  # 필요에 따라 조정
```

---

## 📋 단계별 실행 가이드

### Phase 1: 로컬 테스트 (즉시 가능)
```bash
# 1. 환경변수 파일 생성
cp .env.example .env

# 2. .env 파일에서 비밀번호 수정
# MYSQL_ROOT_PASSWORD, JWT_SECRET 등

# 3. Docker Compose 실행
docker-compose up -d

# 4. 접근 테스트
# http://localhost - 프론트엔드
# http://localhost:8080 - 백엔드
```

**필요한 것**:
- ✅ Docker Desktop 설치됨
- ✅ .env 파일 수정

**시간**: 5분

---

### Phase 2: Oracle Cloud 준비 (30분~1시간)
```bash
# 1. OKE 클러스터 생성 (Oracle Cloud Console)
# 2. kubectl 설정
# 3. OCIR (Docker Registry) 설정
# 4. Nginx Ingress Controller 설치
# 5. cert-manager 설치
```

**필요한 것**:
- ⏳ Oracle Cloud 계정
- ⏳ OKE 클러스터
- ⏳ 도메인 (선택적, 하지만 외부 접근 필요)

**참고**: [DEPLOYMENT.md](./DEPLOYMENT.md) 참조

---

### Phase 3: Jenkins 설정 (30분)
```bash
# 1. Jenkins 서버 준비
# 2. 필수 플러그인 설치
# 3. Credentials 등록 (Docker, Kubeconfig)
# 4. Pipeline Job 생성
```

**필요한 것**:
- ⏳ Jenkins 서버 (Oracle Cloud VM에 설치 가능)
- ⏳ Docker & Kubernetes CLI 플러그인

---

### Phase 4: 배포 (10분)
```bash
# 1. k8s/secret.yaml 수정
# 2. k8s/ingress.yaml 도메인 수정
# 3. Jenkinsfile 수정
# 4. Git Push → Jenkins 자동 배포

# 또는 수동 배포
kubectl apply -f k8s/
```

---

## 🚀 가장 빠른 시작 방법

### 지금 바로 시작 (로컬 테스트)
```bash
# 1단계: 환경변수 파일 생성
cp .env.example .env

# 2단계: .env 파일 열기
notepad .env  # Windows
# 또는
code .env     # VS Code

# 3단계: 비밀번호 수정
# MYSQL_ROOT_PASSWORD=mySecurePassword123!
# JWT_SECRET=myJwtSecretKeyMinimum256BitsLong12345678901234567890

# 4단계: Docker Compose 실행
docker-compose up -d

# 5단계: 브라우저에서 확인
# http://localhost
```

---

## ✅ 체크리스트

배포 전 아래 항목을 확인하세요:

### 로컬 테스트
- [ ] `.env` 파일 생성 및 수정
- [ ] Docker Desktop 실행 중
- [ ] `docker-compose up -d` 실행
- [ ] http://localhost 접속 확인

### Oracle Cloud 배포
- [ ] `k8s/secret.yaml` 비밀번호 수정
- [ ] `k8s/ingress.yaml` 도메인 수정 (3곳)
- [ ] `Jenkinsfile` Docker Registry 수정
- [ ] `k8s/backend-deployment.yaml` 이미지 경로 수정
- [ ] `k8s/frontend-deployment.yaml` 이미지 경로 수정
- [ ] OKE 클러스터 생성
- [ ] kubectl 설정 완료
- [ ] Nginx Ingress Controller 설치
- [ ] cert-manager 설치
- [ ] DNS A 레코드 등록

### Jenkins CI/CD
- [ ] Jenkins 서버 준비
- [ ] Docker Pipeline 플러그인 설치
- [ ] Kubernetes CLI 플러그인 설치
- [ ] Docker Registry Credentials 등록
- [ ] Kubeconfig Secret 등록
- [ ] Pipeline Job 생성

---

## 💡 다음 질문?

- "로컬에서 먼저 테스트하고 싶어요" → `.env` 파일 수정 후 `docker-compose up`
- "Oracle Cloud에 바로 배포하고 싶어요" → 위의 체크리스트 순서대로 진행
- "Jenkins 없이 배포하고 싶어요" → `kubectl apply -f k8s/` 수동 배포 가능
- "특정 파일 수정을 도와주세요" → 말씀해주시면 함께 수정하겠습니다!
