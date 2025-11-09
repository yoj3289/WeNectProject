# 설정 완료! ✅

Oracle Cloud 정보로 모든 설정 파일이 업데이트되었습니다.

---

## 📋 적용된 정보

### Oracle Cloud 정보
- **Region**: ap-chuncheon-1 (춘천)
- **Tenancy Namespace**: axabwwl6wx8h
- **Docker Registry**: ap-chuncheon-1.ocir.io

---

## ✅ 수정된 파일 (3개)

### 1. Jenkinsfile
**수정 내용:**
```groovy
DOCKER_REGISTRY = 'ap-chuncheon-1.ocir.io'
DOCKER_NAMESPACE = 'axabwwl6wx8h/wenect'
```

**결과:**
- Backend 이미지: `ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-backend:latest`
- Frontend 이미지: `ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-frontend:latest`

### 2. k8s/backend-deployment.yaml
**수정 내용:**
```yaml
image: ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-backend:latest
```

### 3. k8s/frontend-deployment.yaml
**수정 내용:**
```yaml
image: ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-frontend:latest
```

---

## 🎯 다음 단계

### 1️⃣ Git 커밋 (지금 바로 가능!)

```bash
git add .
git status  # 변경된 파일 확인
git commit -m "chore: Configure Oracle Cloud settings for Chuncheon region

- Update Jenkinsfile with ap-chuncheon-1 registry
- Update backend deployment image path
- Update frontend deployment image path
- Tenancy namespace: axabwwl6wx8h"

git push origin main
```

---

### 2️⃣ 아직 수정이 필요한 파일 (선택사항)

#### k8s/ingress.yaml - 도메인 설정
**현재 상태:**
```yaml
host: wenect.yourdomain.com  # 3곳
```

**도메인이 있다면 수정:**
```yaml
host: wenect.com  # 실제 도메인
```

**도메인이 없다면:**
- IP 주소로 접근 가능 (HTTPS는 사용 불가)
- 또는 ingress.yaml에서 host 필드 제거

---

### 3️⃣ 배포 준비 사항

#### A. Auth Token 생성 (Docker 로그인용)
Jenkins가 Oracle Container Registry에 이미지를 push하려면 Auth Token이 필요합니다.

**생성 방법:**
```
1. Oracle Cloud Console 접속
2. 프로필 → My profile
3. 좌측 메뉴 → Auth tokens
4. "Generate token" 클릭
5. Description: "jenkins-docker-login"
6. 생성된 토큰 복사 (한 번만 보임!)
```

**Jenkins에 등록:**
```
1. Jenkins 접속
2. Manage Jenkins → Credentials
3. Add Credentials 클릭
4. Kind: Username with password
   - Username: axabwwl6wx8h/oracleidentitycloudservice/your-email
   - Password: [생성한 Auth Token]
   - ID: docker-registry-credentials
```

#### B. Kubeconfig 설정
Jenkins가 Kubernetes 클러스터에 접근하려면 kubeconfig가 필요합니다.

**생성 방법:**
```bash
# OCI CLI로 kubeconfig 다운로드
oci ce cluster create-kubeconfig \
  --cluster-id <cluster-ocid> \
  --file $HOME/.kube/config \
  --region ap-chuncheon-1
```

**Jenkins에 등록:**
```
1. Jenkins → Manage Jenkins → Credentials
2. Add Credentials
3. Kind: Secret file
   - File: kubeconfig 파일 업로드
   - ID: kubeconfig
```

#### C. Kubernetes Secret 생성
```bash
kubectl create secret generic wenect-secret \
  --from-literal=MYSQL_ROOT_PASSWORD='WFc8H57PhI2#Witnt60OTHaK' \
  --from-literal=DB_PASSWORD='WFc8H57PhI2#Witnt60OTHaK' \
  --from-literal=JWT_SECRET='xP3NMxEXPcZPQTQY8wCi+FOMvGZ1uBxKHntKWilJw0owVXlzIOlZFn7SQrCK40UjX3LPPN7/4eFc48ftmE+kqw==' \
  --from-literal=MYSQL_DATABASE='mydb' \
  --from-literal=DB_USERNAME='root' \
  -n wenect
```

---

## 🚀 배포 방법

### 방법 1: Jenkins CI/CD (자동 배포)
```
1. Git에 코드 푸시
2. Jenkins가 자동으로 빌드 시작
3. Docker 이미지 빌드 및 Registry에 푸시
4. Kubernetes에 자동 배포
```

### 방법 2: 수동 배포 (kubectl 사용)
```bash
# 1. Namespace 생성
kubectl apply -f k8s/namespace.yaml

# 2. Secret 생성 (위의 kubectl create secret 명령어)

# 3. ConfigMap 적용
kubectl apply -f k8s/configmap.yaml

# 4. MySQL 배포
kubectl apply -f k8s/mysql-deployment.yaml

# 5. Backend/Frontend 배포
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 6. Ingress 적용
kubectl apply -f k8s/ingress.yaml

# 7. 상태 확인
kubectl get pods -n wenect
kubectl get svc -n wenect
kubectl get ingress -n wenect
```

---

## 📊 수정 전/후 비교

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| **Jenkinsfile** | | |
| DOCKER_REGISTRY | `your-region.ocir.io` | `ap-chuncheon-1.ocir.io` ✅ |
| DOCKER_NAMESPACE | `your-tenancy-namespace` | `axabwwl6wx8h/wenect` ✅ |
| **backend-deployment.yaml** | | |
| image | `your-docker-registry/wenect-backend:latest` | `ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-backend:latest` ✅ |
| **frontend-deployment.yaml** | | |
| image | `your-docker-registry/wenect-frontend:latest` | `ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-frontend:latest` ✅ |

---

## ✅ 완료된 작업

- [x] Oracle Cloud Region 확인 (ap-chuncheon-1)
- [x] Tenancy Namespace 확인 (axabwwl6wx8h)
- [x] Jenkinsfile 수정
- [x] k8s/backend-deployment.yaml 수정
- [x] k8s/frontend-deployment.yaml 수정

---

## 🔜 다음에 해야 할 일

### 필수 작업
- [ ] Git 커밋 및 푸시
- [ ] Auth Token 생성 (Docker 로그인용)
- [ ] Jenkins에 Credentials 등록
- [ ] Kubernetes Secret 생성

### 선택 작업
- [ ] k8s/ingress.yaml 도메인 수정 (도메인 있는 경우)
- [ ] 로컬 테스트 (`docker-compose up -d`)

---

## 💡 팁

### 로컬에서 먼저 테스트
Kubernetes 배포 전에 로컬에서 테스트해보세요:
```bash
docker-compose up -d
```
→ http://localhost 접속

### Docker Registry 로그인 테스트
Ubuntu 서버에서:
```bash
docker login ap-chuncheon-1.ocir.io
# Username: axabwwl6wx8h/oracleidentitycloudservice/your-email
# Password: [Auth Token]
```

### 이미지 수동 빌드 및 푸시 테스트
```bash
# Backend
cd backend
docker build -t ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-backend:test .
docker push ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-backend:test

# Frontend
cd frontend/donation-platform
docker build -t ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-frontend:test .
docker push ap-chuncheon-1.ocir.io/axabwwl6wx8h/wenect-frontend:test
```

---

## 📞 도움이 필요하신가요?

**"Git 커밋 도와주세요"**
→ 커밋 명령어 위에 있습니다!

**"Auth Token 생성하는 법을 모르겠어요"**
→ 위의 "3️⃣ 배포 준비 사항 → A. Auth Token 생성" 참조

**"도메인을 설정하고 싶어요"**
→ k8s/ingress.yaml 파일 수정 방법 안내해드립니다!

**"바로 배포하고 싶어요"**
→ 위의 "🚀 배포 방법" 참조

---

## 🎉 축하합니다!

설정 파일 수정이 완료되었습니다!
이제 Git에 커밋하고 배포를 진행할 수 있습니다! 🚀
