# 🎉 최종 배포 가이드

모든 설정이 완료되었습니다! 이제 배포할 수 있습니다.

---

## ✅ 완료된 설정 확인

### 수정된 파일 (4개)
- [x] **Jenkinsfile** - Docker Registry 경로 (ap-chuncheon-1.ocir.io/axabwwl6wx8h)
- [x] **k8s/backend-deployment.yaml** - 백엔드 이미지 경로
- [x] **k8s/frontend-deployment.yaml** - 프론트엔드 이미지 경로
- [x] **k8s/ingress.yaml** - IP 접근용으로 수정 (도메인 불필요)

### 적용된 정보
- **Region**: ap-chuncheon-1 (춘천) ✅
- **Tenancy Namespace**: axabwwl6wx8h ✅
- **접근 방식**: IP 주소 (HTTP) ✅

---

## 🚀 1단계: Git 커밋

모든 변경사항을 Git에 커밋합니다.

```bash
# 모든 변경사항 추가
git add .

# 변경된 파일 확인
git status

# 커밋
git commit -m "chore: Complete deployment configuration

- Configure Oracle Cloud Chuncheon region (ap-chuncheon-1)
- Update Docker Registry paths (axabwwl6wx8h)
- Configure Ingress for IP-based access (no domain)
- Ready for Kubernetes deployment"

# 푸시
git push origin main
```

---

## 🔐 2단계: Oracle Cloud 인증 설정

### A. Auth Token 생성 (Docker 로그인용)

**Oracle Cloud Console에서:**
```
1. 우측 상단 프로필 아이콘 클릭
2. "My profile" 클릭
3. 좌측 메뉴 "Auth tokens" 클릭
4. "Generate token" 버튼 클릭
5. Description: "jenkins-docker-login" 입력
6. "Generate token" 클릭
7. 생성된 토큰 복사 (⚠️ 한 번만 보임!)
```

**예시 토큰:**
```
abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx
```

**안전한 곳에 저장:**
```
메모장이나 비밀번호 관리 앱에 저장
```

### B. Docker 로그인 테스트 (Ubuntu 서버)

Ubuntu 서버에 SSH 접속 후:

```bash
# Docker 로그인
docker login ap-chuncheon-1.ocir.io

# Username 입력:
axabwwl6wx8h/oracleidentitycloudservice/your-email@example.com

# Password 입력:
[위에서 생성한 Auth Token]
```

**성공 메시지:**
```
Login Succeeded
```

---

## ☸️ 3단계: Kubernetes 클러스터 확인

### OKE 클러스터 상태 확인

**Oracle Cloud Console:**
```
메뉴 → Developer Services → Kubernetes Clusters (OKE)
```

**확인 사항:**
- [ ] 클러스터가 "Active" 상태인가요?
- [ ] 클러스터 이름: _________________

### kubeconfig 다운로드

**방법 1: OCI CLI 사용**
```bash
# OKE 클러스터 OCID 확인 (Console에서 복사)
oci ce cluster create-kubeconfig \
  --cluster-id ocid1.cluster.oc1.ap-chuncheon-1.aaaaa... \
  --file $HOME/.kube/config \
  --region ap-chuncheon-1 \
  --token-version 2.0.0

# kubectl 연결 확인
kubectl cluster-info
kubectl get nodes
```

**방법 2: Oracle Cloud Console에서 직접 다운로드**
```
OKE 클러스터 페이지 → "Access Cluster" 버튼
→ kubeconfig 다운로드 명령어 복사 실행
```

---

## 📦 4단계: Kubernetes Secret 생성

```bash
# wenect namespace에 Secret 생성
kubectl create secret generic wenect-secret \
  --from-literal=MYSQL_ROOT_PASSWORD='WFc8H57PhI2#Witnt60OTHaK' \
  --from-literal=DB_PASSWORD='WFc8H57PhI2#Witnt60OTHaK' \
  --from-literal=JWT_SECRET='xP3NMxEXPcZPQTQY8wCi+FOMvGZ1uBxKHntKWilJw0owVXlzIOlZFn7SQrCK40UjX3LPPN7/4eFc48ftmE+kqw==' \
  --from-literal=MYSQL_DATABASE='mydb' \
  --from-literal=DB_USERNAME='root' \
  -n wenect

# 확인
kubectl get secrets -n wenect
```

**외부 DB 사용 시 (보유하신 DB 주소와 비밀번호로):**
```bash
kubectl create secret generic wenect-secret \
  --from-literal=DB_PASSWORD='실제DB비밀번호' \
  --from-literal=DB_USERNAME='실제DB사용자' \
  --from-literal=JWT_SECRET='xP3NMxEXPcZPQTQY8wCi+FOMvGZ1uBxKHntKWilJw0owVXlzIOlZFn7SQrCK40UjX3LPPN7/4eFc48ftmE+kqw==' \
  -n wenect
```

---

## 🎬 5단계: Kubernetes에 배포

### 수동 배포 (kubectl 사용)

```bash
# 1. Namespace 생성
kubectl apply -f k8s/namespace.yaml

# 2. ConfigMap 적용
kubectl apply -f k8s/configmap.yaml

# 3. MySQL 배포 (k8s 내부 MySQL 사용 시)
kubectl apply -f k8s/mysql-deployment.yaml

# MySQL이 준비될 때까지 대기 (약 1-2분)
kubectl wait --for=condition=ready pod -l app=mysql -n wenect --timeout=300s

# 4. Backend 배포
kubectl apply -f k8s/backend-deployment.yaml

# 5. Frontend 배포
kubectl apply -f k8s/frontend-deployment.yaml

# 6. Ingress 적용
kubectl apply -f k8s/ingress.yaml
```

### 배포 상태 확인

```bash
# Pod 상태 확인
kubectl get pods -n wenect

# 예상 출력:
# NAME                        READY   STATUS    RESTARTS   AGE
# mysql-xxx                   1/1     Running   0          2m
# backend-xxx                 1/1     Running   0          1m
# frontend-xxx                1/1     Running   0          1m

# Service 확인
kubectl get svc -n wenect

# Ingress 확인 (외부 IP)
kubectl get ingress -n wenect
```

---

## 🌐 6단계: 외부 IP 확인 및 접속

### Ingress IP 확인

```bash
kubectl get ingress -n wenect
```

**출력 예시:**
```
NAME              CLASS   HOSTS   ADDRESS          PORTS   AGE
wenect-ingress    nginx   *       123.456.789.10   80      2m
```

**→ ADDRESS 컬럼의 IP 주소를 확인하세요!**

### 접속 테스트

**브라우저에서:**
```
http://123.456.789.10
```

**API 테스트:**
```bash
curl http://123.456.789.10/api/actuator/health
```

**스마트폰에서:**
```
브라우저 → http://123.456.789.10
```

---

## 🎯 Jenkins CI/CD 설정 (선택사항)

Jenkins를 통한 자동 배포를 원하시면:

### A. Jenkins Credentials 등록

**1. Docker Registry Credentials**
```
Jenkins → Manage Jenkins → Credentials → Add Credentials

Kind: Username with password
ID: docker-registry-credentials
Username: axabwwl6wx8h/oracleidentitycloudservice/your-email@example.com
Password: [Auth Token]
```

**2. Kubeconfig**
```
Jenkins → Manage Jenkins → Credentials → Add Credentials

Kind: Secret file
ID: kubeconfig
File: [kubeconfig 파일 업로드]
```

### B. Jenkins Pipeline 생성

```
Jenkins → New Item → Pipeline
Name: wenect-deployment

Pipeline script from SCM:
- SCM: Git
- Repository URL: [your-git-repo-url]
- Script Path: Jenkinsfile

Save
```

### C. 빌드 실행

```
Jenkins → wenect-deployment → Build Now
```

---

## 📊 배포 흐름도

### 수동 배포
```
Git Push
  ↓
SSH → Ubuntu 서버
  ↓
Docker 이미지 빌드
  ↓
OCIR에 Push
  ↓
kubectl apply
  ↓
Kubernetes 배포
  ↓
http://123.456.789.10 접속
```

### Jenkins 자동 배포
```
Git Push
  ↓
Jenkins 자동 감지
  ↓
자동 빌드 & 테스트
  ↓
Docker 이미지 빌드
  ↓
OCIR에 Push
  ↓
Kubernetes 자동 배포
  ↓
http://123.456.789.10 접속
```

---

## 🐛 문제 해결

### 1. Pod가 시작되지 않는 경우

```bash
# Pod 상세 정보
kubectl describe pod <pod-name> -n wenect

# 로그 확인
kubectl logs <pod-name> -n wenect

# 이벤트 확인
kubectl get events -n wenect --sort-by='.lastTimestamp'
```

**일반적인 문제:**
- ImagePullBackOff: Docker Registry 인증 실패
- CrashLoopBackOff: 애플리케이션 시작 실패 (DB 연결 등)

**해결:**
```bash
# OCIR Secret 생성
kubectl create secret docker-registry ocir-secret \
  --docker-server=ap-chuncheon-1.ocir.io \
  --docker-username=axabwwl6wx8h/oracleidentitycloudservice/your-email \
  --docker-password=[Auth-Token] \
  -n wenect

# Deployment에 imagePullSecrets 추가
kubectl edit deployment backend -n wenect
# spec.template.spec에 추가:
# imagePullSecrets:
# - name: ocir-secret
```

### 2. Ingress IP가 안 나오는 경우

```bash
# Ingress Controller 확인
kubectl get pods -n ingress-nginx

# Ingress Controller 설치 필요 시
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
```

### 3. 외부에서 접속이 안 되는 경우

**Oracle Cloud 방화벽 확인:**
```
VCN → Security Lists → Ingress Rules
→ 80, 443 포트 열려있는지 확인
```

**추가:**
```
Source: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
```

---

## ✅ 최종 체크리스트

### Git & 코드
- [ ] Git 커밋 완료
- [ ] Git 푸시 완료

### Oracle Cloud
- [ ] Auth Token 생성 완료
- [ ] Docker 로그인 성공
- [ ] OKE 클러스터 Active 상태
- [ ] kubeconfig 다운로드 완료

### Kubernetes
- [ ] kubectl 연결 확인
- [ ] Secret 생성 완료
- [ ] Namespace 생성
- [ ] ConfigMap 적용
- [ ] MySQL 배포 (또는 외부 DB 설정)
- [ ] Backend 배포
- [ ] Frontend 배포
- [ ] Ingress 적용

### 접속 확인
- [ ] Ingress IP 확인
- [ ] 브라우저에서 접속 성공
- [ ] API 응답 확인

---

## 🎉 축하합니다!

외부에서 프로젝트에 접근할 수 있게 되었습니다!

**접속 주소:**
```
http://[Ingress-IP-주소]
```

**다음 단계:**
- 실제 서비스 테스트
- 사용자 피드백 수집
- 필요시 도메인 구매 및 HTTPS 적용
- 모니터링 및 로그 확인

---

## 📞 추가 도움

**문제가 발생하면:**
1. Pod 로그 확인: `kubectl logs <pod-name> -n wenect`
2. 이벤트 확인: `kubectl get events -n wenect`
3. Service 상태: `kubectl get svc -n wenect`

**Jenkins 문제:**
1. Jenkins 로그 확인
2. Credentials 재확인
3. Pipeline 스크립트 검증

성공적인 배포를 기원합니다! 🚀
