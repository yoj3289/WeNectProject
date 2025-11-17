# WeNect 프로젝트 설정 가이드

## Docker Compose 설정

### 1. docker-compose.yml 파일 생성

`docker-compose.example.yml` 파일을 복사하여 `docker-compose.yml` 파일을 생성합니다:

```bash
cp docker-compose.example.yml docker-compose.yml
```

### 2. 비밀번호 설정

`docker-compose.yml` 파일을 열어 다음 항목들을 실제 값으로 변경하세요:

- `MYSQL_ROOT_PASSWORD`: MySQL root 비밀번호
- `SPRING_DATASOURCE_PASSWORD`: 위와 동일한 MySQL 비밀번호
- `JWT_SECRET`: JWT 토큰 생성에 사용할 256비트 이상의 시크릿 키

**⚠️ 중요**: `docker-compose.yml` 파일은 `.gitignore`에 포함되어 있으므로 GitHub에 업로드되지 않습니다.

### 3. 컨테이너 실행

```bash
docker-compose up -d
```

## 보안 주의사항

다음 파일들은 **절대로 GitHub에 올리지 마세요**:
- `docker-compose.yml` (비밀번호 포함)
- `.env` (환경변수)
- `backend/src/main/resources/application-pay.yml` (카카오페이 API 키)
- SSH 키 파일 (*.pem, *.key, *.ppk)

이 파일들은 이미 `.gitignore`에 추가되어 있습니다.
