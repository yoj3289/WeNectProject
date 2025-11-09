# Git 커밋 전 체크리스트

Git에 푸시하기 전에 **반드시** 확인해야 할 사항들입니다.

---

## ✅ 1단계: 민감한 정보 확인 (매우 중요!)

### 확인 사항
- [x] `.env` 파일이 `.gitignore`에 포함되어 있음 ✅
- [x] `.env` 파일이 Git에 추가되지 않음 ✅

### 추가로 확인할 것
```bash
# .env 파일이 Git에 추가되지 않았는지 확인
git status

# 아래와 같이 나오면 안 됩니다:
# new file:   .env  ← 이렇게 나오면 안 됨!
```

**만약 .env가 나타나면**:
```bash
git rm --cached .env
git commit -m "Remove .env from git"
```

---

## ⚠️ 2단계: 템플릿 파일 확인

현재 생성된 파일들은 **템플릿** 상태입니다. Git에 커밋해도 되지만, 나중에 실제 배포 시 수정이 필요합니다.

### 🔴 Git에 커밋하면 안 되는 파일
- ❌ `.env` - 비밀번호가 들어있음 (이미 .gitignore에 포함됨 ✅)

### 🟡 Git에 커밋해도 되지만 나중에 수정해야 하는 파일

#### 1. k8s/secret.yaml
**현재 상태** (템플릿):
```yaml
DB_PASSWORD: "your-database-password-here"
JWT_SECRET: "your-jwt-secret-key-change-this-in-production"
```

**주의사항**:
- ✅ Git에 커밋 가능 (템플릿이므로)
- ⚠️ 하지만 실제 배포 시에는 kubectl 명령어로 직접 생성해야 함
- ❌ 실제 비밀번호를 넣어서 Git에 올리면 안 됨!

**권장 방법**:
```bash
# 배포 시 kubectl로 직접 생성 (파일 수정 안 함)
kubectl create secret generic wenect-secret \
  --from-literal=DB_PASSWORD='실제비밀번호' \
  --from-literal=JWT_SECRET='실제JWT시크릿' \
  -n wenect
```

#### 2. k8s/ingress.yaml
**현재 상태** (템플릿):
```yaml
host: wenect.yourdomain.com  # 3곳
```

**나중에 수정**:
```yaml
host: wenect.com  # 실제 도메인
```

**3곳 위치**:
- Line 32
- Line 36
- Line 69

#### 3. Jenkinsfile
**현재 상태** (템플릿):
```groovy
DOCKER_REGISTRY = 'your-region.ocir.io'
DOCKER_NAMESPACE = 'your-tenancy-namespace'
```

**나중에 수정**:
```groovy
DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'
DOCKER_NAMESPACE = 'axabcdefgh/wenect'
```

#### 4. k8s/backend-deployment.yaml
**현재 상태** (템플릿):
```yaml
image: your-docker-registry/wenect-backend:latest
```

**나중에 수정**:
```yaml
image: ap-seoul-1.ocir.io/axabcdefgh/wenect-backend:latest
```

#### 5. k8s/frontend-deployment.yaml
**현재 상태** (템플릿):
```yaml
image: your-docker-registry/wenect-frontend:latest
```

**나중에 수정**:
```yaml
image: ap-seoul-1.ocir.io/axabcdefgh/wenect-frontend:latest
```

---

## ✅ 3단계: Git 커밋 가능한 파일 목록

다음 파일들은 **안전하게 Git에 커밋 가능**합니다:

### 새로 생성된 파일들
- ✅ `docker-compose.yml` - 로컬 개발용
- ✅ `.dockerignore` - Docker 빌드 최적화
- ✅ `.env.example` - 환경 변수 예시 (비밀번호 없음)
- ✅ `generate-secrets.js` - Secret 생성 도구

### Docker 관련
- ✅ `backend/Dockerfile`
- ✅ `frontend/donation-platform/Dockerfile`
- ✅ `frontend/donation-platform/nginx.conf`

### Kubernetes 관련 (k8s/)
- ✅ `k8s/namespace.yaml`
- ✅ `k8s/configmap.yaml`
- ✅ `k8s/secret.yaml` - 템플릿 상태 (실제 비밀번호 없음)
- ✅ `k8s/mysql-deployment.yaml`
- ✅ `k8s/backend-deployment.yaml` - 템플릿 상태
- ✅ `k8s/frontend-deployment.yaml` - 템플릿 상태
- ✅ `k8s/ingress.yaml` - 템플릿 상태
- ✅ `k8s/README.md`

### CI/CD
- ✅ `Jenkinsfile` - 템플릿 상태

### 문서
- ✅ `README.md`
- ✅ `QUICKSTART.md`
- ✅ `DEPLOYMENT.md`
- ✅ `TODO.md`
- ✅ `SETUP_COMPLETE.md`
- ✅ `GIT_COMMIT_CHECKLIST.md` (이 파일)

### 프로덕션 설정
- ✅ `backend/src/main/resources/application-prod.properties`

---

## 🎯 4단계: Git 커밋 실행

### 방법 1: 모든 파일 한 번에 커밋
```bash
# 1. 모든 파일 추가
git add .

# 2. .env가 포함되지 않았는지 확인
git status
# ".env"가 나오면 안 됩니다!

# 3. 커밋
git commit -m "feat: Add Docker, Kubernetes, and CI/CD configuration

- Add Docker Compose for local development
- Add Kubernetes manifests for production deployment
- Add Jenkinsfile for CI/CD pipeline
- Add comprehensive deployment documentation
- Add secret generation tool
- Add production application properties"

# 4. 푸시
git push origin main
```

### 방법 2: 파일 그룹별로 나누어 커밋
```bash
# Docker 관련
git add docker-compose.yml .dockerignore backend/Dockerfile frontend/donation-platform/Dockerfile frontend/donation-platform/nginx.conf
git commit -m "feat: Add Docker configuration for containerization"

# Kubernetes 관련
git add k8s/
git commit -m "feat: Add Kubernetes manifests for production deployment"

# CI/CD
git add Jenkinsfile
git commit -m "feat: Add Jenkins CI/CD pipeline"

# 문서
git add README.md QUICKSTART.md DEPLOYMENT.md TODO.md SETUP_COMPLETE.md GIT_COMMIT_CHECKLIST.md
git commit -m "docs: Add comprehensive deployment documentation"

# 기타
git add .env.example generate-secrets.js backend/src/main/resources/application-prod.properties
git commit -m "feat: Add production configuration and utilities"

# 푸시
git push origin main
```

---

## 🔍 5단계: 푸시 후 확인

### GitHub에서 확인할 것
1. `.env` 파일이 올라가지 않았는지 확인
2. `k8s/secret.yaml`에 실제 비밀번호가 없는지 확인
3. README.md가 잘 보이는지 확인

### 확인 방법
```
https://github.com/your-username/wenect

파일 목록에서:
✅ .env 파일이 없어야 함
✅ k8s/secret.yaml에 "your-database-password-here" 템플릿 값만 있어야 함
```

---

## 📋 최종 체크리스트

커밋 전에 다음을 확인하세요:

- [ ] `.env` 파일이 Git에 추가되지 않음
- [ ] `k8s/secret.yaml`에 실제 비밀번호가 없음 (템플릿 값만)
- [ ] `git status`로 추가될 파일 확인
- [ ] 커밋 메시지 작성 완료
- [ ] 푸시 후 GitHub에서 확인

---

## 🎉 요약

### 지금 바로 Git에 커밋해도 되는가?
**✅ 네! 안전합니다.**

현재 생성된 모든 파일은 **템플릿 상태**이므로 민감한 정보가 없습니다.
`.env` 파일은 `.gitignore`에 포함되어 있어서 자동으로 제외됩니다.

### 주의사항
1. `.env` 파일은 **절대** Git에 올리지 마세요
2. `k8s/secret.yaml`에 실제 비밀번호를 넣어서 커밋하지 마세요
3. 배포 시에는 `TODO.md`를 참고하여 필요한 파일들을 수정하세요

### 다음 단계
1. 위의 Git 커밋 명령어 실행
2. GitHub에 푸시
3. 로컬에서 테스트: `docker-compose up -d`
4. Oracle Cloud 배포 시: `TODO.md` 참고하여 파일 수정
