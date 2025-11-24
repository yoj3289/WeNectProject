# 🚨 데이터베이스 비상 복구 가이드

> **WeNect 프로젝트 데이터베이스 긴급 상황 대응 매뉴얼**

---

## 📋 목차

1. [비상 상황 종류](#비상-상황-종류)
2. [정기 백업 설정](#정기-백업-설정)
3. [수동 백업 방법](#수동-백업-방법)
4. [복구 방법](#복구-방법)
5. [빠른 문제 해결](#빠른-문제-해결)
6. [예방 조치](#예방-조치)

---

## 🔴 비상 상황 종류

### 상황 1: 데이터베이스 전체 초기화됨
- **증상**: 모든 테이블이 비어있거나 존재하지 않음
- **원인**: `spring.jpa.hibernate.ddl-auto=create` 설정, 수동 DROP DATABASE
- **해결**: [전체 복구](#전체-복구)

### 상황 2: 일부 테이블만 손상됨
- **증상**: 특정 테이블의 데이터가 손실됨
- **원인**: 잘못된 DELETE/TRUNCATE 쿼리 실행
- **해결**: [선택적 복구](#선택적-복구)

### 상황 3: 데이터 불일치 발생
- **증상**: 금액 합계 오류, 외래키 위반
- **원인**: 트랜잭션 롤백 실패, 동시성 문제
- **해결**: [데이터 무결성 복구](#데이터-무결성-복구)

---

## 📅 정기 백업 설정

### 자동 백업 cron 설정 (권장)

```bash
# VM에서 실행
cd /home/ubuntu/WeNectProject

# 백업 스크립트 실행 권한 부여
chmod +x emergency-backup.sh
chmod +x emergency-restore.sh

# 매일 새벽 3시 자동 백업 설정
crontab -e
```

cron 설정 내용:
```bash
# 매일 03:00 AM 자동 백업
0 3 * * * cd /home/ubuntu/WeNectProject && ./emergency-backup.sh >> /var/log/db_backup.log 2>&1

# 매주 일요일 03:30 AM 주간 백업
30 3 * * 0 cd /home/ubuntu/WeNectProject && ./emergency-backup.sh >> /var/log/db_backup_weekly.log 2>&1
```

### Windows 개발 환경 (작업 스케줄러)

```powershell
# PowerShell에서 실행
$trigger = New-ScheduledTaskTrigger -Daily -At 3AM
$action = New-ScheduledTaskAction -Execute "bash" -Argument "C:\WeNectProject\emergency-backup.sh"
Register-ScheduledTask -TaskName "WeNect_DB_Backup" -Trigger $trigger -Action $action
```

---

## 💾 수동 백업 방법

### 방법 1: 스크립트 사용 (권장)

```bash
# VM 또는 로컬에서 실행
cd /home/ubuntu/WeNectProject  # 또는 C:\WeNectProject

# 백업 실행
./emergency-backup.sh

# 결과 확인
ls -lh database_backups/
```

**백업 파일 위치**: `./database_backups/backup_YYYYMMDD_HHMMSS.sql.gz`

### 방법 2: 수동 mysqldump

```bash
# 전체 데이터베이스 백업
docker exec mydb mysqldump \
  -uroot \
  -p'1!DnlsprxM2@QlalfqjsgH3#' \
  --single-transaction \
  --routines \
  --triggers \
  --databases mydb \
  > manual_backup_$(date +%Y%m%d_%H%M%S).sql

# 압축
gzip manual_backup_*.sql
```

### 방법 3: 특정 테이블만 백업

```bash
# users 테이블만 백업
docker exec mydb mysqldump \
  -uroot \
  -p'1!DnlsprxM2@QlalfqjsgH3#' \
  mydb users \
  > users_backup.sql

# 여러 테이블 백업 (users, projects, donations)
docker exec mydb mysqldump \
  -uroot \
  -p'1!DnlsprxM2@QlalfqjsgH3#' \
  mydb users projects donations \
  > critical_tables_backup.sql
```

---

## 🔧 복구 방법

### 전체 복구

```bash
cd /home/ubuntu/WeNectProject  # 또는 C:\WeNectProject

# 사용 가능한 백업 목록 확인
ls -lh database_backups/

# 복구 스크립트 실행
./emergency-restore.sh database_backups/backup_20250124_030000.sql.gz

# 프롬프트에서 "yes" 입력하여 확인
```

**⚠️ 경고**: 복구 시 현재 데이터베이스가 삭제됩니다!

### 선택적 복구

특정 테이블만 복구하는 경우:

```bash
# 1. 백업 파일 압축 해제
gunzip -c database_backups/backup_20250124_030000.sql.gz > temp_backup.sql

# 2. users 테이블만 추출
sed -n '/CREATE TABLE.*`users`/,/UNLOCK TABLES/p' temp_backup.sql > users_only.sql

# 3. users 테이블만 복구
docker exec -i mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' mydb < users_only.sql

# 4. 임시 파일 삭제
rm temp_backup.sql users_only.sql
```

### 데이터 무결성 복구

```bash
# emergency-queries.sql 실행 (무결성 검증)
docker exec -i mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' mydb < emergency-queries.sql

# 문제 발견 시 해당 섹션의 수정 쿼리 실행
```

---

## ⚡ 빠른 문제 해결

### 문제: 백업 파일을 찾을 수 없음

```bash
# 백업 디렉토리 확인
ls -la database_backups/

# 백업 디렉토리가 없으면 생성
mkdir -p database_backups

# 즉시 백업 실행
./emergency-backup.sh
```

### 문제: Docker 컨테이너가 실행 중이 아님

```bash
# 컨테이너 상태 확인
docker ps -a | grep mydb

# 컨테이너 시작
docker-compose up -d mydb

# 컨테이너 로그 확인
docker-compose logs mydb
```

### 문제: 백엔드가 데이터베이스에 연결되지 않음

```bash
# application-prod.properties 확인
cat backend/src/main/resources/application-prod.properties

# 데이터베이스 연결 테스트
docker exec mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' -e "SHOW DATABASES;"

# 백엔드 재시작
docker-compose restart backend
```

### 문제: "Access denied for user 'root'" 오류

```bash
# 비밀번호 확인
echo "1!DnlsprxM2@QlalfqjsgH3#"

# docker-compose.yml의 MYSQL_ROOT_PASSWORD 확인
grep MYSQL_ROOT_PASSWORD docker-compose.yml

# MySQL 루트 비밀번호 리셋 (최후의 수단)
docker-compose down
docker volume rm wenectproject_mysql_data  # 주의: 데이터 삭제됨!
docker-compose up -d
```

---

## 🛡️ 예방 조치

### 1. application-prod.properties 설정 확인

```properties
# ⚠️ 절대 사용하지 말 것!
# spring.jpa.hibernate.ddl-auto=create
# spring.jpa.hibernate.ddl-auto=create-drop

# ✅ 안전한 설정
spring.jpa.hibernate.ddl-auto=none  # 또는 validate
```

### 2. 백업 자동화 확인

```bash
# cron 작업 확인
crontab -l

# 백업 로그 확인
tail -f /var/log/db_backup.log
```

### 3. 주요 작업 전 백업

다음 작업 전에는 **반드시** 백업:
- ✅ Spring Boot 설정 변경 (`ddl-auto` 관련)
- ✅ 대량 데이터 수정/삭제 쿼리 실행
- ✅ 데이터베이스 마이그레이션
- ✅ Docker 컨테이너 재생성
- ✅ 운영 서버 배포

### 4. 백업 파일 외부 보관

```bash
# 백업 파일을 다른 서버로 복사 (예: 개인 PC)
scp -r ubuntu@your-vm-ip:/home/ubuntu/WeNectProject/database_backups ./local_backup/

# 또는 클라우드 스토리지 업로드 (예: AWS S3, Google Drive)
# rclone copy database_backups/ remote:backup/wenect/
```

---

## 📞 긴급 연락처

- **데이터베이스 위치**: VM - `140.245.64.178:3306`
- **데이터베이스명**: `mydb`
- **백업 보관 기간**: 최근 5개 (약 5일치)

---

## 🧪 복구 시뮬레이션 (테스트)

정기적으로 복구 과정을 테스트하여 비상 상황에 대비하세요:

```bash
# 1. 현재 상태 백업
./emergency-backup.sh

# 2. 테스트 데이터베이스 생성
docker exec mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' -e "CREATE DATABASE test_restore;"

# 3. 백업을 테스트 DB로 복구
gunzip -c database_backups/backup_latest.sql.gz | \
  sed 's/mydb/test_restore/g' | \
  docker exec -i mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#'

# 4. 테스트 DB 확인
docker exec mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' test_restore -e "SHOW TABLES;"

# 5. 테스트 DB 삭제
docker exec mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' -e "DROP DATABASE test_restore;"
```

---

## 📝 체크리스트

### 백업 전 확인사항
- [ ] Docker 컨테이너 정상 실행 중
- [ ] 충분한 디스크 공간 (최소 1GB 여유)
- [ ] 백업 디렉토리 쓰기 권한 확인

### 복구 전 확인사항
- [ ] 현재 상태를 긴급 백업함
- [ ] 백업 파일 무결성 확인 (`gunzip -t`)
- [ ] 백엔드 애플리케이션 중지
- [ ] 복구할 백업 파일의 생성 시각 확인

### 복구 후 확인사항
- [ ] 모든 테이블 존재 확인
- [ ] 레코드 수 확인 (users, projects, donations)
- [ ] 외래키 제약조건 검증
- [ ] 백엔드 재시작 및 연결 테스트
- [ ] 프론트엔드에서 기능 동작 확인

---

**마지막 업데이트**: 2025-01-24
**작성자**: Claude Code Assistant
**문서 버전**: 1.0
