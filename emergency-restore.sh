#!/bin/bash

# ================================================
# WeNect 데이터베이스 비상 복구 스크립트
# ================================================
# 사용법: ./emergency-restore.sh [백업파일경로]
# 예시: ./emergency-restore.sh ./database_backups/backup_20250124_120000.sql.gz

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 데이터베이스 설정
DB_NAME="mydb"
DB_USER="root"
DB_PASSWORD="1!DnlsprxM2@QlalfqjsgH3#"
DB_HOST="localhost"

# 인자 확인
if [ $# -eq 0 ]; then
    echo -e "${RED}오류: 백업 파일 경로를 지정해주세요${NC}"
    echo -e "사용법: $0 <백업파일경로>"
    echo -e "\n사용 가능한 백업 파일:"
    ls -lh ./database_backups/*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    exit 1
fi

BACKUP_FILE=$1

# 백업 파일 존재 확인
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}오류: 백업 파일을 찾을 수 없습니다: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${RED}================================================${NC}"
echo -e "${RED}⚠️  경고: 데이터베이스 복구 작업${NC}"
echo -e "${RED}================================================${NC}"
echo -e "${YELLOW}현재 데이터베이스의 모든 데이터가 삭제됩니다!${NC}"
echo -e "백업 파일: ${BACKUP_FILE}"
echo -e "\n${RED}정말 복구하시겠습니까? (yes 입력 필요)${NC}"
read -p "> " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}복구 취소됨${NC}"
    exit 0
fi

echo -e "\n${GREEN}[1/5] 현재 데이터베이스 백업 중...${NC}"
EMERGENCY_BACKUP="./database_backups/emergency_before_restore_$(date +%Y%m%d_%H%M%S).sql"
docker exec mydb mysqldump \
  -u${DB_USER} \
  -p${DB_PASSWORD} \
  --single-transaction \
  --databases ${DB_NAME} \
  > ${EMERGENCY_BACKUP}

if [ $? -eq 0 ]; then
    gzip ${EMERGENCY_BACKUP}
    echo -e "${GREEN}✓ 현재 상태 백업 완료: ${EMERGENCY_BACKUP}.gz${NC}"
else
    echo -e "${RED}✗ 백업 실패${NC}"
    exit 1
fi

echo -e "\n${GREEN}[2/5] 기존 데이터베이스 삭제 중...${NC}"
docker exec mydb mysql -u${DB_USER} -p${DB_PASSWORD} -e "DROP DATABASE IF EXISTS ${DB_NAME};"
echo -e "${GREEN}✓ 데이터베이스 삭제 완료${NC}"

echo -e "\n${GREEN}[3/5] 데이터베이스 재생성 중...${NC}"
docker exec mydb mysql -u${DB_USER} -p${DB_PASSWORD} -e "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo -e "${GREEN}✓ 데이터베이스 재생성 완료${NC}"

echo -e "\n${GREEN}[4/5] 백업 데이터 복구 중...${NC}"
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c ${BACKUP_FILE} | docker exec -i mydb mysql -u${DB_USER} -p${DB_PASSWORD}
else
    cat ${BACKUP_FILE} | docker exec -i mydb mysql -u${DB_USER} -p${DB_PASSWORD}
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 데이터 복구 완료${NC}"
else
    echo -e "${RED}✗ 복구 실패${NC}"
    echo -e "${YELLOW}긴급 백업으로 롤백하려면 다음 명령어를 실행하세요:${NC}"
    echo -e "  ./emergency-restore.sh ${EMERGENCY_BACKUP}.gz"
    exit 1
fi

echo -e "\n${GREEN}[5/5] 복구 결과 확인...${NC}"
docker exec mydb mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "
SELECT
    TABLE_NAME as '테이블',
    TABLE_ROWS as '레코드수'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '${DB_NAME}'
ORDER BY TABLE_ROWS DESC;
"

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}복구 완료!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "복구된 백업: ${BACKUP_FILE}"
echo -e "롤백용 백업: ${EMERGENCY_BACKUP}.gz"
echo -e "\n${YELLOW}참고:${NC}"
echo -e "  - 백엔드 재시작 필요: docker-compose restart backend"
echo -e "  - 캐시 초기화 권장"
