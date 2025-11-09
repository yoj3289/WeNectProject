# 외부 접근을 위한 필수 수정 가이드

이 문서는 **외부에서 프로젝트에 접근**할 수 있도록 하기 위해 **반드시 수정해야 할 파일들**을 정리합니다.

---

## 🎯 목표

**인터넷 어디서나** 웹 브라우저로 프로젝트에 접근:
```
https://wenect.com (또는 여러분의 도메인)
```

---

## 📋 필수 수정 파일 (5개)

### ✅ 체크리스트

외부 접근을 위해 수정해야 할 파일:

- [ ] 1. `k8s/ingress.yaml` - 도메인 설정 (3곳)
- [ ] 2. `Jenkinsfile` - Docker Registry 경로 (2곳)
- [ ] 3. `k8s/backend-deployment.yaml` - 백엔드 이미지 경로 (1곳)
- [ ] 4. `k8s/frontend-deployment.yaml` - 프론트엔드 이미지 경로 (1곳)
- [ ] 5. `k8s/secret.yaml` - 비밀번호 설정 (kubectl로 생성 권장)

---

## 📝 파일별 상세 수정 방법

---

### 1️⃣ k8s/ingress.yaml (가장 중요!)

**이 파일이 외부 접근의 핵심입니다!**

#### 수정 위치: 3곳

**Line 32:**
```yaml
# 수정 전
- wenect.yourdomain.com

# 수정 후 (도메인이 wenect.com인 경우)
- wenect.com

# 또는 도메인 없이 IP만 사용 (HTTPS 불가)
- 123.456.789.10  # Kubernetes Ingress 외부 IP
```

**Line 36:**
```yaml
# 수정 전
- host: wenect.yourdomain.com

# 수정 후
- host: wenect.com
```

**Line 69:**
```yaml
# 수정 전
- host: wenect.yourdomain.com

# 수정 후
- host: wenect.com
```

#### 💡 도메인이 없는 경우
도메인 없이 IP 주소만 사용하려면:
```yaml
spec:
  rules:
  - http:  # host 필드를 아예 제거
      paths:
      - path: /
        ...
```

---

### 2️⃣ Jenkinsfile

**Docker 이미지를 어디에 저장할지 설정**

#### 수정 위치: Line 6-7

```groovy
// 수정 전
DOCKER_REGISTRY = 'your-region.ocir.io'
DOCKER_NAMESPACE = 'your-tenancy-namespace'

// 수정 후 (Oracle Cloud 서울 리전 사용 시)
DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'
DOCKER_NAMESPACE = 'axabcdefgh/wenect'  // 실제 Tenancy Namespace
```

#### 확인 방법
```
Oracle Cloud Console
→ 프로필 아이콘 (우측 상단)
→ Tenancy: <이름> 클릭
→ "Object Storage Namespace" 복사
→ 현재 리전 확인 (예: Seoul → ap-seoul-1)
```

#### Region 코드표
| 리전 | 코드 |
|------|------|
| 서울 | ap-seoul-1 |
| 춘천 | ap-chuncheon-1 |
| 도쿄 | ap-tokyo-1 |
| 오사카 | ap-osaka-1 |
| 뭄바이 | ap-mumbai-1 |
| 싱가포르 | ap-singapore-1 |

---

### 3️⃣ k8s/backend-deployment.yaml

**백엔드 Docker 이미지 경로 설정**

#### 수정 위치: Line 20

```yaml
# 수정 전
image: your-docker-registry/wenect-backend:latest

# 수정 후 (Jenkinsfile과 동일하게)
image: ap-seoul-1.ocir.io/axabcdefgh/wenect-backend:latest
```

**패턴:**
```
[Region].ocir.io/[Tenancy Namespace]/wenect-backend:latest
```

---

### 4️⃣ k8s/frontend-deployment.yaml

**프론트엔드 Docker 이미지 경로 설정**

#### 수정 위치: Line 20

```yaml
# 수정 전
image: your-docker-registry/wenect-frontend:latest

# 수정 후 (Jenkinsfile과 동일하게)
image: ap-seoul-1.ocir.io/axabcdefgh/wenect-frontend:latest
```

---

### 5️⃣ k8s/secret.yaml

**⚠️ 이 파일은 수정하지 말고, kubectl 명령어로 직접 생성하세요!**

#### 권장 방법 (kubectl 사용)

```bash
kubectl create secret generic wenect-secret \
  --from-literal=MYSQL_ROOT_PASSWORD='WFc8H57PhI2#Witnt60OTHaK' \
  --from-literal=DB_PASSWORD='WFc8H57PhI2#Witnt60OTHaK' \
  --from-literal=JWT_SECRET='xP3NMxEXPcZPQTQY8wCi+FOMvGZ1uBxKHntKWilJw0owVXlzIOlZFn7SQrCK40UjX3LPPN7/4eFc48ftmE+kqw==' \
  --from-literal=MYSQL_DATABASE='mydb' \
  --from-literal=DB_USERNAME='root' \
  -n wenect
```

#### 또는 외부 DB 사용 시 (보유하신 DB 정보로)

```bash
kubectl create secret generic wenect-secret \
  --from-literal=DB_PASSWORD='실제DB비밀번호' \
  --from-literal=DB_USERNAME='실제DB사용자' \
  --from-literal=JWT_SECRET='xP3NMxEXPcZPQTQY8wCi+FOMvGZ1uBxKHntKWilJw0owVXlzIOlZFn7SQrCK40UjX3LPPN7/4eFc48ftmE+kqw==' \
  -n wenect
```

---

## 🔧 실제 수정 예시

### 예시 시나리오
- **Tenancy Namespace**: `axabcdefgh`
- **Region**: `ap-seoul-1` (서울)
- **도메인**: `wenect.com`

### 수정 결과

#### 1. k8s/ingress.yaml
```yaml
spec:
  tls:
  - hosts:
    - wenect.com  # ✅ 수정됨
    secretName: wenect-tls-secret
  rules:
  - host: wenect.com  # ✅ 수정됨
    http:
      paths:
      - path: /api
        ...
---
apiVersion: networking.k8s.io/v1
kind: Ingress
...
spec:
  rules:
  - host: wenect.com  # ✅ 수정됨
    http:
      paths:
      - path: /
        ...
```

#### 2. Jenkinsfile
```groovy
environment {
    DOCKER_REGISTRY = 'ap-seoul-1.ocir.io'  # ✅ 수정됨
    DOCKER_NAMESPACE = 'axabcdefgh/wenect'  # ✅ 수정됨
    ...
}
```

#### 3. k8s/backend-deployment.yaml
```yaml
containers:
- name: backend
  image: ap-seoul-1.ocir.io/axabcdefgh/wenect-backend:latest  # ✅ 수정됨
```

#### 4. k8s/frontend-deployment.yaml
```yaml
containers:
- name: frontend
  image: ap-seoul-1.ocir.io/axabcdefgh/wenect-frontend:latest  # ✅ 수정됨
```

---

## 🚀 수정 후 배포 순서

### 1단계: 파일 수정
위의 5개 파일을 수정합니다.

### 2단계: Git 커밋
```bash
git add .
git commit -m "chore: Update deployment configuration for production"
git push origin main
```

### 3단계: Kubernetes에 배포
```bash
# Namespace 생성
kubectl apply -f k8s/namespace.yaml

# Secret 생성 (kubectl 명령어 사용)
kubectl create secret generic wenect-secret \
  --from-literal=DB_PASSWORD='실제비밀번호' \
  --from-literal=JWT_SECRET='실제JWT시크릿' \
  -n wenect

# ConfigMap 적용
kubectl apply -f k8s/configmap.yaml

# MySQL 배포
kubectl apply -f k8s/mysql-deployment.yaml

# 백엔드/프론트엔드 배포
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Ingress 적용 (외부 접근!)
kubectl apply -f k8s/ingress.yaml
```

### 4단계: 외부 IP 확인
```bash
kubectl get ingress -n wenect
```

출력 예시:
```
NAME              CLASS   HOSTS         ADDRESS         PORTS
wenect-ingress    nginx   wenect.com    123.456.789.10  80, 443
```

### 5단계: DNS 설정 (도메인 사용 시)
```
도메인 관리 페이지 (가비아, Cloudflare 등)
→ DNS 레코드 추가
→ Type: A
→ Name: @ (또는 wenect)
→ Value: 123.456.789.10 (위에서 확인한 ADDRESS)
```

### 6단계: 접속 확인
```
https://wenect.com
```

---

## 📊 요약 테이블

| 파일 | 수정 내용 | 예시 |
|------|----------|------|
| `k8s/ingress.yaml` | 도메인 3곳 | `wenect.com` |
| `Jenkinsfile` | Registry, Namespace | `ap-seoul-1.ocir.io`, `axabcdefgh/wenect` |
| `k8s/backend-deployment.yaml` | 이미지 경로 | `ap-seoul-1.ocir.io/axabcdefgh/wenect-backend:latest` |
| `k8s/frontend-deployment.yaml` | 이미지 경로 | `ap-seoul-1.ocir.io/axabcdefgh/wenect-frontend:latest` |
| `k8s/secret.yaml` | kubectl로 생성 | (파일 수정 안 함) |

---

## 🎯 지금 필요한 정보

위의 파일들을 수정하려면 다음 정보가 필요합니다:

### 필수 정보 (2개)
1. **Tenancy Namespace**: `_______________`
2. **Region**: `_______________` (예: ap-seoul-1)

### 선택 정보 (1개)
3. **도메인**: `_______________` (없으면 IP 사용)

---

## 💬 다음 단계

### 옵션 A: 정보를 알려주시면 제가 직접 수정
```
"Tenancy Namespace는 axabcdefgh이고, Region은 ap-seoul-1입니다"
```
→ 5개 파일을 모두 수정해드립니다!

### 옵션 B: 직접 수정하시겠다면
위의 가이드를 따라 5개 파일을 수정하세요.

### 옵션 C: Oracle Cloud에서 정보 확인 방법부터
```
"Tenancy Namespace가 뭔지 모르겠어요"
```
→ 확인 방법을 단계별로 안내해드립니다!

어떻게 하시겠어요? 😊
