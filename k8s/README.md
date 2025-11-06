# Kubernetes 매니페스트 파일

이 디렉토리는 WeNect 프로젝트의 Kubernetes 배포를 위한 매니페스트 파일들을 포함합니다.

## 파일 목록

### 기본 설정
- `namespace.yaml` - Kubernetes 네임스페이스 정의
- `configmap.yaml` - 애플리케이션 설정 (비민감 정보)
- `secret.yaml` - 민감한 정보 (패스워드, JWT Secret 등)

### 데이터베이스
- `mysql-deployment.yaml` - MySQL 데이터베이스 Deployment, PVC, Service

### 애플리케이션
- `backend-deployment.yaml` - Spring Boot 백엔드 Deployment & Service
- `frontend-deployment.yaml` - React 프론트엔드 Deployment & Service

### 네트워킹
- `ingress.yaml` - Nginx Ingress 설정 (외부 접근, SSL)

## 배포 순서

```bash
# 1. Namespace 생성
kubectl apply -f namespace.yaml

# 2. ConfigMap & Secret 적용
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# 3. MySQL 배포
kubectl apply -f mysql-deployment.yaml

# 4. MySQL 준비 대기
kubectl wait --for=condition=ready pod -l app=mysql -n wenect --timeout=300s

# 5. Backend 배포
kubectl apply -f backend-deployment.yaml

# 6. Frontend 배포
kubectl apply -f frontend-deployment.yaml

# 7. Ingress 적용
kubectl apply -f ingress.yaml
```

## 주의사항

### Secret 관리
`secret.yaml` 파일에는 민감한 정보가 포함되어 있습니다.
- 프로덕션에서는 이 파일을 Git에 커밋하지 마세요
- kubectl create secret 명령어를 사용하거나
- 외부 Secret 관리 시스템 (Vault, AWS Secrets Manager 등)을 사용하세요

### 도메인 설정
`ingress.yaml`에서 다음을 수정해야 합니다:
- `wenect.yourdomain.com` → 실제 도메인으로 변경

### 스토리지 클래스
`mysql-deployment.yaml`의 PVC에서:
- `storageClassName: oci-bv` (Oracle Cloud Block Volume)
- 다른 클라우드 사용 시 적절한 스토리지 클래스로 변경

## 리소스 확인

```bash
# 모든 리소스 확인
kubectl get all -n wenect

# Pod 상태
kubectl get pods -n wenect

# 로그 확인
kubectl logs -f deployment/backend -n wenect
kubectl logs -f deployment/frontend -n wenect

# Ingress 외부 IP 확인
kubectl get ingress -n wenect
```
