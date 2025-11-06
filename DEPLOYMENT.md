# WeNect 프로젝트 배포 가이드

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [Oracle Cloud + Kubernetes 배포](#oracle-cloud--kubernetes-배포)
4. [Jenkins CI/CD 파이프라인](#jenkins-cicd-파이프라인)
5. [외부 접근 설정](#외부-접근-설정)
6. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 로컬 개발
- Java 17 이상
- Node.js 18 이상
- Docker & Docker Compose
- Git

### 프로덕션 배포
- Oracle Cloud 계정
- Kubernetes 클러스터 (OKE - Oracle Kubernetes Engine)
- Jenkins 서버
- Docker Registry (OCIR - Oracle Container Image Registry)
- 도메인 (외부 접근용)

---

## 로컬 개발 환경

### 1. 저장소 클론
```bash
git clone <repository-url>
cd wenect
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 실제 값으로 수정
```

### 3. Docker Compose로 실행
```bash
docker-compose up -d
```

### 4. 접근
- Frontend: http://localhost
- Backend API: http://localhost:8080
- MySQL: localhost:3306

### 5. 중지
```bash
docker-compose down
```

---

## Oracle Cloud + Kubernetes 배포

### 1. Oracle Cloud 사전 준비

#### 1.1 OKE 클러스터 생성
```bash
# Oracle Cloud Console에서 OKE 클러스터 생성
# 또는 OCI CLI 사용
oci ce cluster create --name wenect-cluster \
  --kubernetes-version v1.28.2 \
  --vcn-id <vcn-ocid> \
  --service-lb-subnet-ids '["<subnet-ocid>"]'
```

#### 1.2 kubectl 설정
```bash
# kubeconfig 다운로드
oci ce cluster create-kubeconfig \
  --cluster-id <cluster-ocid> \
  --file $HOME/.kube/config \
  --region <your-region>

# 연결 확인
kubectl cluster-info
kubectl get nodes
```

#### 1.3 Docker Registry 설정 (OCIR)
```bash
# Docker 로그인
docker login <region>.ocir.io
# Username: <tenancy-namespace>/<username>
# Password: <auth-token>

# Kubernetes Secret 생성
kubectl create secret docker-registry ocir-secret \
  --docker-server=<region>.ocir.io \
  --docker-username='<tenancy-namespace>/<username>' \
  --docker-password='<auth-token>' \
  --docker-email=<email> \
  -n wenect
```

### 2. Nginx Ingress Controller 설치

```bash
# Helm 설치 (없는 경우)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Nginx Ingress Controller 설치
kubectl create namespace ingress-nginx

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --set controller.service.type=LoadBalancer
```

### 3. cert-manager 설치 (HTTPS SSL 자동 발급)

```bash
# cert-manager 설치
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Let's Encrypt Issuer 생성
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 4. Kubernetes 리소스 배포

#### 4.1 Secret 설정 (중요!)
```bash
# k8s/secret.yaml 파일의 비밀번호를 실제 값으로 변경
# 또는 kubectl 명령어로 직접 생성
kubectl create secret generic wenect-secret \
  --from-literal=DB_USERNAME=root \
  --from-literal=DB_PASSWORD='your-secure-password' \
  --from-literal=JWT_SECRET='your-jwt-secret-minimum-256-bits' \
  --from-literal=MYSQL_ROOT_PASSWORD='your-secure-password' \
  --from-literal=MYSQL_DATABASE=mydb \
  -n wenect
```

#### 4.2 ConfigMap 및 리소스 배포
```bash
# Namespace 생성
kubectl apply -f k8s/namespace.yaml

# ConfigMap 적용
kubectl apply -f k8s/configmap.yaml

# MySQL 배포
kubectl apply -f k8s/mysql-deployment.yaml

# MySQL이 준비될 때까지 대기
kubectl wait --for=condition=ready pod -l app=mysql -n wenect --timeout=300s

# Backend 배포
kubectl apply -f k8s/backend-deployment.yaml

# Frontend 배포
kubectl apply -f k8s/frontend-deployment.yaml

# Ingress 배포 (도메인 설정 필요)
# k8s/ingress.yaml에서 wenect.yourdomain.com을 실제 도메인으로 변경
kubectl apply -f k8s/ingress.yaml
```

#### 4.3 배포 확인
```bash
# Pod 상태 확인
kubectl get pods -n wenect

# Service 확인
kubectl get svc -n wenect

# Ingress 확인 (외부 IP 확인)
kubectl get ingress -n wenect

# 로그 확인
kubectl logs -f deployment/backend -n wenect
kubectl logs -f deployment/frontend -n wenect
```

---

## Jenkins CI/CD 파이프라인

### 1. Jenkins 설정

#### 1.1 필수 플러그인 설치
- Docker Pipeline
- Kubernetes CLI
- Git
- Pipeline
- Credentials Binding

#### 1.2 Credentials 등록

**Docker Registry Credentials**
```
Jenkins > Manage Jenkins > Credentials > Add Credentials
- Kind: Username with password
- ID: docker-registry-credentials
- Username: <tenancy-namespace>/<username>
- Password: <auth-token>
```

**Kubeconfig**
```
Jenkins > Manage Jenkins > Credentials > Add Credentials
- Kind: Secret file
- ID: kubeconfig
- File: Upload your kubeconfig file
```

### 2. Jenkins Pipeline 생성

#### 2.1 새 Pipeline Job 생성
```
Jenkins > New Item > Pipeline
- Name: wenect-deployment
- Pipeline script from SCM
- SCM: Git
- Repository URL: <your-git-repo>
- Script Path: Jenkinsfile
```

#### 2.2 Jenkinsfile 수정
[Jenkinsfile](./Jenkinsfile)에서 다음 값을 수정:
```groovy
DOCKER_REGISTRY = 'your-region.ocir.io'
DOCKER_NAMESPACE = 'your-tenancy-namespace'
```

### 3. 파이프라인 실행

```bash
# Git Push 시 자동 트리거 또는
# Jenkins에서 수동 실행
Build Now
```

---

## 외부 접근 설정

### 1. 도메인 설정

#### 1.1 Ingress External IP 확인
```bash
kubectl get ingress -n wenect
# EXTERNAL-IP 확인
```

#### 1.2 DNS A 레코드 추가
```
Type: A
Name: wenect (또는 @)
Value: <EXTERNAL-IP>
TTL: 300
```

### 2. 방화벽 규칙 (Oracle Cloud)

```bash
# Security List에서 다음 포트 열기
# HTTP: 80
# HTTPS: 443
```

### 3. HTTPS 인증서

cert-manager가 자동으로 Let's Encrypt 인증서를 발급합니다.
발급 상태 확인:
```bash
kubectl get certificate -n wenect
kubectl describe certificate wenect-tls-secret -n wenect
```

### 4. 접근 테스트

```bash
# HTTP
curl http://wenect.yourdomain.com

# HTTPS
curl https://wenect.yourdomain.com

# Backend API
curl https://wenect.yourdomain.com/api/health
```

---

## 문제 해결

### 1. Pod가 시작되지 않는 경우

```bash
# Pod 상태 확인
kubectl describe pod <pod-name> -n wenect

# 로그 확인
kubectl logs <pod-name> -n wenect

# 이벤트 확인
kubectl get events -n wenect --sort-by='.lastTimestamp'
```

### 2. 데이터베이스 연결 실패

```bash
# MySQL Pod 확인
kubectl exec -it <mysql-pod-name> -n wenect -- mysql -u root -p

# 연결 테스트
kubectl exec -it <backend-pod-name> -n wenect -- curl mysql-service:3306
```

### 3. 이미지 Pull 실패

```bash
# Secret 확인
kubectl get secret ocir-secret -n wenect

# Deployment에 imagePullSecrets 추가
spec:
  template:
    spec:
      imagePullSecrets:
      - name: ocir-secret
```

### 4. Ingress가 작동하지 않는 경우

```bash
# Ingress Controller 확인
kubectl get pods -n ingress-nginx

# Ingress 로그 확인
kubectl logs -n ingress-nginx <ingress-controller-pod>
```

### 5. 스마트폰에서 접근 불가

- 도메인 DNS 전파 확인 (최대 48시간 소요)
- 방화벽 규칙 확인
- HTTPS 인증서 발급 확인
- 모바일 브라우저 캐시 삭제

---

## 모니터링

### 로그 확인
```bash
# 실시간 로그
kubectl logs -f deployment/backend -n wenect
kubectl logs -f deployment/frontend -n wenect

# 이전 컨테이너 로그
kubectl logs deployment/backend -n wenect --previous
```

### 리소스 사용량
```bash
kubectl top nodes
kubectl top pods -n wenect
```

---

## 업데이트 및 롤백

### 수동 업데이트
```bash
# 이미지 업데이트
kubectl set image deployment/backend backend=<new-image>:tag -n wenect

# 롤아웃 상태 확인
kubectl rollout status deployment/backend -n wenect
```

### 롤백
```bash
# 이전 버전으로 롤백
kubectl rollout undo deployment/backend -n wenect

# 특정 리비전으로 롤백
kubectl rollout undo deployment/backend --to-revision=2 -n wenect
```

---

## 참고 자료

- [Oracle Kubernetes Engine Documentation](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)

---

## 연락처

문제가 발생하면 프로젝트 관리자에게 문의하세요.
