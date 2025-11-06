# 빠른 시작 가이드

이 가이드는 **5분 안에** 로컬에서 프로젝트를 실행하는 방법을 안내합니다.

---

## ✅ 사전 준비 (확인만 하세요)

- [x] Docker Desktop 설치됨
- [x] Docker Desktop 실행 중
- [x] `.env` 파일 생성됨 (이미 생성되어 있습니다!)

---

## 🚀 실행 방법 (3단계)

### 1단계: Docker Compose 실행
```bash
docker-compose up -d
```

**예상 시간**: 2-3분 (첫 실행 시 이미지 다운로드)

### 2단계: 실행 확인
```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인 (선택사항)
docker-compose logs -f
```

**정상 출력 예시**:
```
NAME                  STATUS
wenect-mysql          Up 2 minutes (healthy)
wenect-backend        Up 1 minute (healthy)
wenect-frontend       Up 1 minute (healthy)
```

### 3단계: 브라우저에서 접속
- **프론트엔드**: http://localhost
- **백엔드 API**: http://localhost:8080
- **헬스체크**: http://localhost:8080/actuator/health

---

## 📱 같은 네트워크에서 스마트폰 접근

### Windows에서 내 IP 확인
```bash
ipconfig
```
→ `IPv4 주소` 확인 (예: 192.168.0.10)

### 스마트폰 브라우저에서 접속
```
http://192.168.0.10
```

**주의**: PC와 스마트폰이 **같은 WiFi**에 연결되어 있어야 합니다!

---

## 🛑 중지 방법

### 컨테이너만 중지 (데이터 유지)
```bash
docker-compose stop
```

### 컨테이너 삭제 (데이터 유지)
```bash
docker-compose down
```

### 완전 삭제 (데이터 포함)
```bash
docker-compose down -v
```

---

## 🔄 재시작 방법

### 전체 재시작
```bash
docker-compose restart
```

### 특정 서비스만 재시작
```bash
# 백엔드만
docker-compose restart backend

# 프론트엔드만
docker-compose restart frontend
```

---

## 🐛 문제 해결

### 문제 1: 포트가 이미 사용 중
```
Error: Bind for 0.0.0.0:80 failed: port is already allocated
```

**해결**:
```bash
# 80 포트 사용 중인 프로세스 확인
netstat -ano | findstr :80

# 또는 docker-compose.yml에서 포트 변경
# ports:
#   - "8081:80"  # 80 대신 8081 포트 사용
```

### 문제 2: MySQL이 시작되지 않음
```bash
# MySQL 로그 확인
docker-compose logs mysql

# MySQL 재시작
docker-compose restart mysql
```

### 문제 3: 백엔드가 DB 연결 실패
```bash
# MySQL이 완전히 시작될 때까지 대기
docker-compose up -d mysql
sleep 30
docker-compose up -d backend
```

### 문제 4: 프론트엔드가 백엔드에 연결 안 됨
- `.env` 파일의 `VITE_API_URL` 확인
- 백엔드가 정상 실행 중인지 확인: http://localhost:8080/actuator/health

---

## 📊 데이터베이스 접속

### MySQL Workbench / DBeaver 등 사용
- **Host**: localhost
- **Port**: 3306
- **Username**: root
- **Password**: `.env` 파일의 `MYSQL_ROOT_PASSWORD` 참조
- **Database**: mydb

### 터미널에서 직접 접속
```bash
docker-compose exec mysql mysql -u root -p
# 비밀번호 입력: WFc8H57PhI2#Witnt60OTHaK
```

---

## 🎯 다음 단계

로컬에서 정상 작동을 확인했다면:

1. **Oracle Cloud 배포**: [DEPLOYMENT.md](./DEPLOYMENT.md) 참조
2. **Jenkins CI/CD 설정**: [DEPLOYMENT.md](./DEPLOYMENT.md) 참조
3. **도메인 연결**: [TODO.md](./TODO.md) 참조

---

## 💡 팁

### 개발 중 자동 재빌드
```bash
# 코드 변경 시 자동 재시작 (개발 모드)
docker-compose watch  # Docker Compose v2.22+ 필요
```

### 로그 실시간 확인
```bash
# 모든 서비스
docker-compose logs -f

# 백엔드만
docker-compose logs -f backend

# 최근 100줄만
docker-compose logs --tail=100 backend
```

### 컨테이너 내부 접속
```bash
# 백엔드 컨테이너 쉘 접속
docker-compose exec backend sh

# MySQL 컨테이너 쉘 접속
docker-compose exec mysql bash
```

---

## ❓ FAQ

### Q: 첫 실행이 느려요
A: Docker 이미지를 다운로드하는 시간입니다. 두 번째부터는 빠릅니다.

### Q: 데이터가 사라졌어요
A: `docker-compose down -v` 명령어는 볼륨도 삭제합니다. `-v` 옵션 없이 사용하세요.

### Q: 코드를 수정했는데 반영이 안 돼요
A:
```bash
# 이미지 재빌드
docker-compose up -d --build
```

### Q: 완전히 처음부터 다시 시작하고 싶어요
```bash
# 모든 것 삭제
docker-compose down -v
docker system prune -a

# 다시 시작
docker-compose up -d
```

---

## 📞 도움이 필요하신가요?

문제가 계속되면:
1. `docker-compose logs` 로그 확인
2. GitHub Issues에 문의
3. 프로젝트 관리자에게 연락

즐거운 개발 되세요! 🎉
