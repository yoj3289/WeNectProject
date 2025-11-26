# WeNect - 기부 플랫폼

<div align="center">

![WeNect Logo](https://img.shields.io/badge/WeNect-기부플랫폼-red?style=for-the-badge&logo=heart&logoColor=white)

**따뜻한 마음을 연결하는 기부 플랫폼**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-140.245.64.178-blue?style=flat-square)](http://140.245.64.178)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)

[데모 사이트](http://140.245.64.178) | [기능 소개](#-주요-기능) | [기술 스택](#️-기술-스택) | [설치 방법](#-설치-및-실행)

</div>

---

## 📖 프로젝트 소개

**WeNect**는 2025 융합프로젝트로 개발된 온라인 기부 플랫폼입니다.

기부자와 수혜자를 연결하여 투명하고 신뢰할 수 있는 기부 문화를 만들어갑니다. 개인 및 단체 기부자 모두 쉽고 편리하게 기부에 참여할 수 있으며, 다양한 결제 수단을 지원합니다.

### 🎯 프로젝트 목표
- 투명한 기부 프로세스 제공
- 사용자 친화적인 기부 경험
- 커뮤니티를 통한 기부 문화 확산
- 안전한 결제 시스템 구축

---

## 🌐 라이브 데모

> **🔗 [http://140.245.64.178](http://140.245.64.178)**

테스트 계정:
- 이메일: `test@test.com`
- 비밀번호: `test1234!`

---

## ✨ 주요 기능

### 🏠 메인 기능
| 기능 | 설명 |
|------|------|
| **프로젝트 탐색** | 다양한 기부 프로젝트 검색 및 필터링 |
| **기부하기** | 카카오페이, 토스페이를 통한 간편 결제 |
| **프로젝트 등록** | 단체 회원의 기부 프로젝트 생성 |
| **기부 현황** | 실시간 모금 현황 및 진행률 확인 |

### 👤 회원 기능
| 기능 | 설명 |
|------|------|
| **회원가입** | 개인/단체 회원 가입 (약관 동의 포함) |
| **로그인/로그아웃** | JWT 기반 인증 |
| **마이페이지** | 기부 내역, 프로필 관리 |
| **프로필 수정** | 개인정보 및 프로필 이미지 변경 |

### 💬 커뮤니티
| 기능 | 설명 |
|------|------|
| **게시글 작성** | 기부 후기, 정보 공유 |
| **댓글/대댓글** | 게시글에 대한 소통 |
| **좋아요** | 게시글 및 댓글 좋아요 |
| **링크 공유** | 댓글 링크 복사 및 공유 |

### 💳 결제 시스템
| 결제 수단 | 상태 |
|-----------|------|
| **토스페이** | ✅ 연동 완료 (일반 카드 결제) |
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
| MySQL | 8.0 | 데이터베이스 |
| JWT | - | 토큰 기반 인증 |
| Argon2 | - | 비밀번호 암호화 |

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
| Nginx | 리버스 프록시 & 정적 파일 서빙 |
| Oracle Cloud | 클라우드 인프라 (VM) |

### 결제 연동
| 서비스 | 설명 |
|--------|------|
| Toss Payments | 토스페이 일반 결제 |
| Kakao Pay | 카카오페이 결제 |

---

## 📁 프로젝트 구조

```
WeNect/
├── backend/                      # Spring Boot 백엔드
│   ├── src/main/java/
│   │   └── com/wenect/donation_paltform/
│   │       ├── domain/
│   │       │   ├── auth/         # 인증/인가
│   │       │   ├── user/         # 사용자 관리
│   │       │   ├── project/      # 기부 프로젝트
│   │       │   ├── donation/     # 기부 내역
│   │       │   ├── payment/      # 결제 (카카오페이, 토스페이)
│   │       │   └── community/    # 커뮤니티 (게시글, 댓글)
│   │       └── global/           # 공통 설정, 보안, 예외처리
│   ├── build.gradle
│   └── Dockerfile
│
├── frontend/donation-platform/   # React 프론트엔드
│   ├── src/
│   │   ├── components/           # 재사용 컴포넌트
│   │   ├── pages/                # 페이지 컴포넌트
│   │   ├── hooks/                # 커스텀 훅
│   │   ├── lib/                  # 유틸리티
│   │   └── store/                # 상태 관리
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml            # Docker 구성
├── uploads/                      # 업로드 파일 저장소
└── README.md
```

---

## 🚀 설치 및 실행

### 사전 요구사항
- Docker & Docker Compose
- (선택) Java 17, Node.js 18+

### Docker로 실행 (권장)

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/WeNectProject.git
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

---

## 🔧 환경 설정

### Backend 설정 파일
- `application.yml` - 기본 설정
- `application-prod.yml` - 운영 환경
- `application-pay.yml` - 결제 API 키 (gitignore)

### Frontend 환경 변수
```env
# .env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_IMAGE_BASE_URL=http://140.245.64.178
```

---

## 📱 스크린샷

| 메인 페이지 | 프로젝트 상세 |
|-------------|---------------|
| 기부 프로젝트 목록 | 프로젝트 정보 및 기부하기 |

| 커뮤니티 | 결제 |
|----------|------|
| 게시글/댓글 | 토스페이/카카오페이 |

---

## 🔐 보안

- **비밀번호 암호화**: Argon2
- **인증**: JWT (Access Token)
- **CORS**: 설정 완료
- **환경 변수**: Git 제외 (.gitignore)
- **API 키**: 별도 설정 파일로 관리

---

## 📊 API 엔드포인트

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 내 정보 조회 |

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

### 커뮤니티
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/community/posts` | 게시글 목록 |
| POST | `/api/community/posts` | 게시글 작성 |
| GET | `/api/community/posts/{id}/comments` | 댓글 목록 |
| POST | `/api/community/posts/{id}/comments` | 댓글 작성 |

---

## 👥 팀 소개

### 2025 융합프로젝트팀

| 역할 | 담당 |
|------|------|
| **Backend** | Spring Boot, API 개발, DB 설계 |
| **Frontend** | React, UI/UX 구현 |
| **DevOps** | Docker, 배포, 인프라 |
| **기획** | 서비스 기획, 요구사항 정의 |

---

## 📝 업데이트 로그

### v1.0.0 (2025.11)
- 기본 기부 플랫폼 기능 구현
- 회원가입/로그인 (개인/단체)
- 프로젝트 CRUD
- 카카오페이 결제 연동
- 토스페이 결제 연동
- 커뮤니티 (게시글, 댓글, 대댓글)
- 좋아요, 링크 공유 기능

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

프로젝트 관련 문의사항은 [Issues](https://github.com/your-repo/WeNectProject/issues)로 등록해주세요.

---

<div align="center">

**Made with ❤️ by WeNect Team**

</div>
