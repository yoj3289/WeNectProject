# WeNect Project
2025 융합프로젝트 위넥트 프로젝트

기부 플랫폼 - Spring Boot + React + MySQL

---

## 🚀 빠른 시작

### 로컬에서 즉시 실행 (5분)
```bash
docker-compose up -d
```
→ 자세한 내용은 **[QUICKSTART.md](./QUICKSTART.md)** 참조

### Oracle Cloud + Kubernetes 배포
→ **[DEPLOYMENT.md](./DEPLOYMENT.md)** 참조

### 수정해야 할 설정 파일
→ **[TODO.md](./TODO.md)** 참조

---

## 📁 프로젝트 구조

```
wenect/
├── backend/                 # Spring Boot 백엔드
│   ├── src/
│   ├── build.gradle
│   └── Dockerfile
├── frontend/                # React 프론트엔드
│   └── donation-platform/
│       ├── src/
│       ├── package.json
│       ├── Dockerfile
│       └── nginx.conf
├── k8s/                     # Kubernetes 매니페스트
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── mysql-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── docker-compose.yml       # 로컬 개발용
├── Jenkinsfile             # CI/CD 파이프라인
├── .env                    # 환경 변수 (Git 제외)
└── generate-secrets.js     # Secret 생성 도구
```

---

## 🛠️ 기술 스택

### Backend
- Java 17
- Spring Boot 3.5.6
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0
- Lombok
- Argon2 (비밀번호 암호화)

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- Axios
- React Router
- Zustand (상태관리)
- React Query

### DevOps
- Docker & Docker Compose
- Kubernetes (OKE)
- Jenkins (CI/CD)
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)

---

## 📖 문서

- **[QUICKSTART.md](./QUICKSTART.md)** - 5분 만에 로컬 실행
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 프로덕션 배포 가이드
- **[TODO.md](./TODO.md)** - 수정 필요 항목 체크리스트
- **[k8s/README.md](./k8s/README.md)** - Kubernetes 매니페스트 설명

---

## 🔧 개발 환경 설정

### 1. 사전 요구사항
- Docker Desktop
- (선택) Java 17 (로컬 개발 시)
- (선택) Node.js 18+ (로컬 개발 시)

### 2. 환경 변수 설정
`.env` 파일이 이미 생성되어 있습니다.

### 3. 실행
```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d

# 접속
# - 프론트엔드: http://localhost
# - 백엔드 API: http://localhost:8080
# - DB: localhost:3306
```

---

## 🌐 외부 접근

### 로컬 네트워크 (같은 WiFi)
```bash
# Windows에서 IP 확인
ipconfig

# 스마트폰에서 접속
http://192.168.x.x
```

### 인터넷 전체 공개
1. **Oracle Cloud** + **Kubernetes** 배포
2. **도메인** 연결
3. **SSL 인증서** 자동 발급

→ 자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참조

---

## 🔐 보안

- 비밀번호: Argon2 해싱
- 인증: JWT 토큰
- HTTPS: Let's Encrypt SSL
- CORS: 설정됨
- 환경 변수: Git 제외 (.env)

---

## 📝 API 문서

백엔드 실행 후:
- Actuator: http://localhost:8080/actuator

---

## 🤝 기여

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

## 👥 팀

2025 융합프로젝트팀

---

## 📞 문의

프로젝트 관련 문의사항은 이슈로 등록해주세요.
