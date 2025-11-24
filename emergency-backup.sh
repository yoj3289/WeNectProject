#!/bin/bash

# ================================================
# WeNect 데이터베이스 비상 백업 스크립트
# ================================================
# 사용법: ./emergency-backup.sh
# 결과: backup_YYYYMMDD_HHMMSS.sql 파일 생성

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 백업 설정
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./database_backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
DB_NAME="mydb"
DB_USER="root"
DB_PASSWORD="1!DnlsprxM2@QlalfqjsgH3#"
DB_HOST="localhost"

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}WeNect 데이터베이스 비상 백업 시작${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "백업 시각: ${TIMESTAMP}"
echo -e "백업 파일: ${BACKUP_FILE}\n"

# 1. 전체 데이터베이스 백업 (구조 + 데이터)
echo -e "${GREEN}[1/4] 전체 데이터베이스 백업 중...${NC}"
docker exec mydb mysqldump \
  -u${DB_USER} \
  -p${DB_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --databases ${DB_NAME} \
  > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 전체 백업 완료${NC}"
else
    echo -e "${RED}✗ 백업 실패${NC}"
    exit 1
fi

# 2. 테이블별 레코드 수 확인
echo -e "\n${GREEN}[2/4] 테이블별 데이터 통계...${NC}"
docker exec mydb mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "
SELECT
    TABLE_NAME as '테이블',
    TABLE_ROWS as '레코드수'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '${DB_NAME}'
ORDER BY TABLE_ROWS DESC;
"

# 3. 백업 파일 압축
echo -e "\n${GREEN}[3/4] 백업 파일 압축 중...${NC}"
gzip ${BACKUP_FILE}
COMPRESSED_FILE="${BACKUP_FILE}.gz"
BACKUP_SIZE=$(ls -lh ${COMPRESSED_FILE} | awk '{print $5}')
echo -e "${GREEN}✓ 압축 완료 (크기: ${BACKUP_SIZE})${NC}"

# 4. 백업 검증
echo -e "\n${GREEN}[4/4] 백업 파일 검증 중...${NC}"
if gunzip -t ${COMPRESSED_FILE} 2>/dev/null; then
    echo -e "${GREEN}✓ 백업 파일 무결성 확인 완료${NC}"
else
    echo -e "${RED}✗ 백업 파일 손상됨${NC}"
    exit 1
fi

# 5. 최근 5개 백업만 유지 (자동 정리)
echo -e "\n${GREEN}[정리] 오래된 백업 파일 삭제...${NC}"
ls -t ${BACKUP_DIR}/backup_*.sql.gz | tail -n +6 | xargs -r rm
echo -e "${GREEN}✓ 최근 5개 백업만 유지${NC}"

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}백업 완료!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "백업 파일: ${COMPRESSED_FILE}"
echo -e "파일 크기: ${BACKUP_SIZE}"
echo -e "\n${YELLOW}복구 방법:${NC}"
echo -e "  gunzip -c ${COMPRESSED_FILE} | docker exec -i mydb mysql -u${DB_USER} -p${DB_PASSWORD}"
echo -e "\n${YELLOW}백업 목록 확인:${NC}"
echo -e "  ls -lh ${BACKUP_DIR}/"
