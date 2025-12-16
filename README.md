# WeNect - 기부 플랫폼

<div align="center">

![WeNect Logo](https://img.shields.io/badge/WeNect-기부플랫폼-red?style=for-the-badge&logo=heart&logoColor=white)

**따뜻한 마음을 연결하는 기부 플랫폼**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-wenect.duckdns.org-blue?style=flat-square)](https://wenect.duckdns.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)

[데모 사이트](https://wenect.duckdns.org) | [기능 소개](#-주요-기능) | [기술 스택](#️-기술-스택) | [설치 방법](#-설치-및-실행)

</div>

---

## 📖 프로젝트 소개

**WeNect**는 2025 융합프로젝트로 개발된 온라인 기부 플랫폼입니다.

기부자와 수혜자를 연결하여 투명하고 신뢰할 수 있는 기부 문화를 만들어갑니다. 개인 및 단체 기부자 모두 쉽고 편리하게 기부에 참여할 수 있으며, 다양한 결제 수단을 지원합니다.

### 🎯 프로젝트 특징

> **💡 100% 수수료 무료 플랫폼**
>
> WeNect는 플랫폼 수수료, PG 수수료 등 일체의 수수료를 받지 않습니다.
> 기부자가 기부한 금액이 전액 수혜 기관에 전달됩니다.

- **투명한 기부 프로세스**: 모든 기부 내역과 정산 과정이 투명하게 공개됩니다
- **실시간 알림 시스템**: WebSocket 기반 실시간 알림으로 기부 현황을 즉시 확인
- **안전한 결제**: 카카오페이, 토스페이 등 검증된 결제 시스템 연동
- **커뮤니티**: 기부 문화 확산을 위한 소통 공간

---

## 🌐 라이브 데모

> **🔗 [https://wenect.duckdns.org](https://wenect.duckdns.org)**
>
> (IP 직접 접속: http://140.245.64.178)

테스트 계정:
- 이메일: `test@test.com`
- 비밀번호: `test1234!`

---

## ✨ 주요 기능

### 🏠 기부 기능
| 기능 | 설명 |
|------|------|
| **프로젝트 탐색** | 카테고리별 검색, 필터링, 정렬 |
| **기부하기** | 카카오페이, 토스페이 간편 결제 |
| **실시간 현황** | 모금 진행률, 기부자 수 실시간 확인 |
| **저금통** | 개인별 기부금 적립 및 관리 |

### 👤 회원 기능
| 기능 | 설명 |
|------|------|
| **회원가입** | 개인(USER) / 단체(ORGANIZATION) 회원 구분 |
| **JWT 인증** | Access Token 기반 보안 인증 |
| **마이페이지** | 기부 내역, 저금통, 프로필 관리 |
| **비밀번호 찾기** | 이메일 기반 비밀번호 재설정 |

### 🏢 기관(단체) 기능
| 기능 | 설명 |
|------|------|
| **프로젝트 등록** | 기부 프로젝트 생성 및 관리 |
| **정산 요청** | 모금 완료 후 정산 신청 |
| **대시보드** | 프로젝트별 기부 현황 통계 |
| **프로필 관리** | 기관 정보 및 계좌 정보 관리 |

### 🔔 알림 시스템
| 기능 | 설명 |
|------|------|
| **실시간 알림** | WebSocket 기반 즉시 알림 |
| **SMS 알림** | 중요 이벤트 문자 알림 (NCP SENS) |
| **알림 설정** | 알림 유형별 수신 설정 |

### 👨‍💼 관리자 기능
| 기능 | 설명 |
|------|------|
| **기관 승인** | 신규 기관 가입 심사 및 승인/반려 |
| **프로젝트 관리** | 프로젝트 승인, 수정, 삭제 |
| **정산 관리** | 정산 요청 승인 및 송금 처리 |
| **통계 대시보드** | 플랫폼 전체 통계 조회 |

### 💬 커뮤니티
| 기능 | 설명 |
|------|------|
| **게시글 작성** | 기부 후기, 정보 공유 |
| **댓글/대댓글** | 소통 및 토론 |
| **좋아요** | 게시글 및 댓글 좋아요 |
| **링크 공유** | SNS 공유 기능 |

### 💳 결제 시스템
| 결제 수단 | 상태 |
|-----------|------|
| **토스페이** | ✅ 연동 완료 |
| **카카오페이** | ✅ 연동 완료 |

---

## 🛠️ 기술 스택

### Backend
| 기술 | 버전 | 설명 |
|------|------|------|
| Java | 17 | 프로그래밍 언어 |
| Spring Boot | 3.5.6 | 웹 프레임워크 |
| Spring Security | - | 인증/인가 |
| Spring Data JPA | - | ORM |
| Spring WebSocket | - | 실시간 통신 |
| MySQL | 8.0 | 데이터베이스 |
| Redis | - | 캐싱 (성능 최적화) |
| JWT | - | 토큰 기반 인증 |
| Argon2 | - | 비밀번호 암호화 |
| AES-256 | - | 계좌번호 암호화 |

### Frontend
| 기술 | 버전 | 설명 |
|------|------|------|
| React | 19 | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Vite | - | 빌드 도구 |
| TailwindCSS | 3.x | CSS 프레임워크 |
| React Query | - | 서버 상태 관리 |
| Zustand | - | 클라이언트 상태 관리 |
| React Router | 6 | 라우팅 |
| Axios | - | HTTP 클라이언트 |
| Lucide React | - | 아이콘 |

### DevOps & Infrastructure
| 기술 | 설명 |
|------|------|
| Docker | 컨테이너화 |
| Docker Compose | 멀티 컨테이너 관리 |
| Kubernetes | 오케스트레이션 (k8s) |
| Nginx | 리버스 프록시 & 정적 파일 서빙 |
| Oracle Cloud | 클라우드 인프라 (VM) |
| Jenkins | CI/CD 파이프라인 |

### 외부 서비스 연동
| 서비스 | 설명 |
|--------|------|
| Toss Payments | 토스페이 결제 |
| Kakao Pay | 카카오페이 결제 |
| NCP SENS | SMS 문자 알림 |
| Spring Mail | 이메일 발송 |

---

## 📁 프로젝트 구조

```
WeNect/
├── backend/                      # Spring Boot 백엔드
│   ├── src/main/java/
│   │   └── com/wenect/donation_paltform/
│   │       ├── domain/
│   │       │   ├── auth/         # 인증/인가 (로그인, 회원가입)
│   │       │   ├── user/         # 사용자 관리
│   │       │   ├── organization/ # 기관(단체) 관리
│   │       │   ├── project/      # 기부 프로젝트
│   │       │   ├── donation/     # 기부 내역
│   │       │   ├── payment/      # 결제 (카카오페이, 토스페이)
│   │       │   ├── piggybank/    # 저금통 (개인 기부금 적립)
│   │       │   ├── settlement/   # 정산 관리
│   │       │   ├── finance/      # 재무/수익 관리
│   │       │   ├── notification/ # 알림 시스템
│   │       │   ├── statistics/   # 통계
│   │       │   ├── admin/        # 관리자 기능
│   │       │   └── community/    # 커뮤니티 (게시글, 댓글)
│   │       └── global/
│   │           ├── config/       # 설정 (Redis, WebSocket, Security)
│   │           ├── websocket/    # WebSocket 핸들러
│   │           ├── service/      # 공통 서비스 (SMS, 파일)
│   │           └── exception/    # 예외 처리
│   ├── build.gradle
│   └── Dockerfile
│
├── frontend/donation-platform/   # React 프론트엔드
│   ├── src/
│   │   ├── components/           # 재사용 컴포넌트
│   │   ├── pages/                # 페이지 컴포넌트
│   │   ├── hooks/                # 커스텀 훅
│   │   ├── api/                  # API 호출
│   │   ├── stores/               # Zustand 상태 관리
│   │   └── lib/                  # 유틸리티
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── k8s/                          # Kubernetes 매니페스트
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── mysql-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
│
├── docker-compose.yml            # Docker 구성
├── Jenkinsfile                   # CI/CD 파이프라인
└── README.md
```

---

## 🚀 설치 및 실행

### 사전 요구사항
- Docker & Docker Compose
- (선택) Java 17, Node.js 18+
- (선택) Redis Server

### Docker로 실행 (권장)

```bash
# 1. 저장소 클론
git clone https://github.com/yoj3289/WeNectProject.git
cd WeNectProject

# 2. Docker Compose로 실행
docker-compose up -d --build

# 3. 접속
# - 프론트엔드: http://localhost
# - 백엔드 API: http://localhost:8080/api
```

### 로컬 개발 환경

**Backend**
```bash
cd backend
./gradlew bootRun
```

**Frontend**
```bash
cd frontend/donation-platform
npm install
npm run dev
```

**Redis (캐싱 사용 시)**
```bash
# Windows: Redis 설치 후 실행
redis-server

# Docker로 실행
docker run -d -p 6379:6379 redis:alpine
```

---

## 🔧 환경 설정

### Backend 설정 파일
| 파일 | 설명 |
|------|------|
| `application.properties` | 기본 설정 (DB, Redis, SMS) |
| `application-pay.yml` | 결제 API 키 (gitignore) |

### 주요 설정 항목

```properties
# Redis 캐싱
spring.data.redis.host=localhost
spring.data.redis.port=6379

# SMS (NCP SENS)
sms.ncp.enabled=false
sms.ncp.access-key=YOUR_ACCESS_KEY
sms.ncp.secret-key=YOUR_SECRET_KEY

# 계좌번호 암호화 (AES-256)
encryption.account.secret-key=YOUR_SECRET_KEY
```

### Frontend 환경 변수
```env
# .env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_IMAGE_BASE_URL=https://wenect.duckdns.org
```

---

## 📊 API 엔드포인트

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 내 정보 조회 |
| POST | `/api/auth/password/reset` | 비밀번호 재설정 |

### 프로젝트
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/projects` | 프로젝트 목록 |
| GET | `/api/projects/{id}` | 프로젝트 상세 |
| POST | `/api/projects` | 프로젝트 생성 |

### 결제
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/payments/toss/prepare` | 토스페이 결제 준비 |
| POST | `/api/payments/toss/confirm` | 토스페이 결제 승인 |
| POST | `/api/payments/kakao/ready` | 카카오페이 결제 준비 |
| POST | `/api/payments/kakao/approve` | 카카오페이 결제 승인 |

### 알림
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/notifications` | 알림 목록 |
| PUT | `/api/notifications/{id}/read` | 알림 읽음 처리 |
| WS | `/ws/notifications` | WebSocket 실시간 알림 |

### 커뮤니티
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/community/posts` | 게시글 목록 |
| POST | `/api/community/posts` | 게시글 작성 |
| GET | `/api/community/posts/{id}/comments` | 댓글 목록 |
| POST | `/api/community/posts/{id}/comments` | 댓글 작성 |

---

## 🔐 보안

- **비밀번호 암호화**: Argon2 (OWASP 권장)
- **계좌번호 암호화**: AES-256 (JPA Converter)
- **인증**: JWT Access Token
- **CORS**: 화이트리스트 기반 설정
- **환경 변수**: Git 제외 (.gitignore)
- **API 키**: 별도 설정 파일로 관리

---

## 📝 업데이트 로그

### v1.1.0 (2025.12)
- ✨ WebSocket 실시간 알림 시스템 추가
- ✨ Redis 캐싱 적용 (통계, 대시보드)
- ✨ SMS 알림 연동 (NCP SENS)
- ✨ 기관 프로필 관리 기능 추가
- 🔧 정산 시스템 개선 (직접 계좌 송금)
- 🔧 수수료 정책 변경 (0% 수수료)
- 🐛 계좌번호 암호화 초기화 문제 해결
- 🐛 TypeScript 빌드 에러 수정

### v1.0.0 (2025.11)
- 기본 기부 플랫폼 기능 구현
- 회원가입/로그인 (개인/단체)
- 프로젝트 CRUD
- 카카오페이/토스페이 결제 연동
- 커뮤니티 (게시글, 댓글, 대댓글)
- 좋아요, 링크 공유 기능

---

## 👥 팀 소개

### 2025 융합프로젝트팀

| 역할 | 담당 |
|------|------|
| **Backend** | Spring Boot, API 개발, DB 설계 |
| **Frontend** | React, UI/UX 구현 |
| **DevOps** | Docker, K8s, CI/CD, 인프라 |
| **기획** | 서비스 기획, 요구사항 정의 |

---

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

## 📞 문의

프로젝트 관련 문의사항은 [Issues](https://github.com/yoj3289/WeNectProject/issues)로 등록해주세요.

---

<div align="center">

**Made with ❤️ by WeNect Team**

*"기부의 가치를 연결합니다"*

</div>
#   C I / C D   T e s t  
 