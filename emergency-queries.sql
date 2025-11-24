-- ================================================
-- WeNect 비상용 SQL 쿼리 모음
-- ================================================
-- 실행 방법: docker exec mydb mysql -uroot -p1!DnlsprxM2@QlalfqjsgH3# mydb < emergency-queries.sql

-- ================================================
-- 1. 데이터베이스 상태 확인
-- ================================================

-- 1-1. 전체 테이블 목록 및 레코드 수
SELECT
    TABLE_NAME as '테이블명',
    TABLE_ROWS as '레코드수',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as '크기(MB)',
    ENGINE as '엔진',
    TABLE_COLLATION as '인코딩'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
ORDER BY TABLE_ROWS DESC;

-- 1-2. 데이터베이스 전체 크기
SELECT
    ROUND(SUM((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as '전체크기(MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb';

-- 1-3. 최근 생성된 테이블
SELECT
    TABLE_NAME,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
ORDER BY CREATE_TIME DESC
LIMIT 10;

-- ================================================
-- 2. 핵심 데이터 카운트 확인
-- ================================================

-- 2-1. 사용자 통계
SELECT
    '일반 사용자' as 구분,
    COUNT(*) as 수량
FROM users
WHERE user_type = 'INDIVIDUAL'
UNION ALL
SELECT
    '기관 사용자',
    COUNT(*)
FROM users
WHERE user_type = 'ORGANIZATION'
UNION ALL
SELECT
    '관리자',
    COUNT(*)
FROM users
WHERE user_type = 'ADMIN'
UNION ALL
SELECT
    '전체 사용자',
    COUNT(*)
FROM users;

-- 2-2. 프로젝트 통계
SELECT
    '전체 프로젝트' as 구분,
    COUNT(*) as 수량,
    COALESCE(SUM(current_amount), 0) as '총모금액',
    COALESCE(SUM(target_amount), 0) as '목표금액'
FROM projects
UNION ALL
SELECT
    '진행중',
    COUNT(*),
    COALESCE(SUM(current_amount), 0),
    COALESCE(SUM(target_amount), 0)
FROM projects
WHERE status = 'ACTIVE' AND end_date >= CURDATE()
UNION ALL
SELECT
    '종료됨',
    COUNT(*),
    COALESCE(SUM(current_amount), 0),
    COALESCE(SUM(target_amount), 0)
FROM projects
WHERE status = 'COMPLETED' OR end_date < CURDATE();

-- 2-3. 후원 통계
SELECT
    DATE_FORMAT(created_at, '%Y-%m') as '월',
    COUNT(*) as '후원건수',
    SUM(amount) as '총후원금액'
FROM donations
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY 월 DESC
LIMIT 12;

-- 2-4. 커뮤니티 통계
SELECT
    '게시글' as 구분,
    COUNT(*) as 수량
FROM posts
UNION ALL
SELECT
    '댓글',
    COUNT(*)
FROM comments
UNION ALL
SELECT
    '게시글 좋아요',
    COUNT(*)
FROM post_likes
UNION ALL
SELECT
    '댓글 좋아요',
    COUNT(*)
FROM comment_likes;

-- ================================================
-- 3. 비상 데이터 수동 백업 (CSV 내보내기)
-- ================================================

-- 3-1. 사용자 데이터 백업
SELECT * FROM users
INTO OUTFILE '/tmp/users_backup.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\'
LINES TERMINATED BY '\n';

-- 3-2. 프로젝트 데이터 백업
SELECT * FROM projects
INTO OUTFILE '/tmp/projects_backup.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\'
LINES TERMINATED BY '\n';

-- 3-3. 후원 데이터 백업
SELECT * FROM donations
INTO OUTFILE '/tmp/donations_backup.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\'
LINES TERMINATED BY '\n';

-- ================================================
-- 4. 비상 복구용 - 테이블 재생성 (DDL)
-- ================================================

-- 4-1. users 테이블 재생성
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('INDIVIDUAL', 'ORGANIZATION', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4-2. organizations 테이블 재생성
CREATE TABLE IF NOT EXISTS organizations (
    org_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(100),
    business_number VARCHAR(20),
    address TEXT,
    description TEXT,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4-3. projects 테이블 재생성
CREATE TABLE IF NOT EXISTS projects (
    project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    thumbnail_url VARCHAR(500),
    category VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    INDEX idx_org_id (org_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5. 긴급 데이터 정리
-- ================================================

-- 5-1. 90일 이전 삭제된 사용자 로그 정리
DELETE FROM user_deletion_logs
WHERE deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 5-2. 읽은 알림 90일 이후 정리
DELETE FROM notifications
WHERE is_read = TRUE
AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 5-3. 만료된 세션 정리 (필요 시)
-- DELETE FROM sessions WHERE expires_at < NOW();

-- ================================================
-- 6. 데이터 무결성 검증
-- ================================================

-- 6-1. 외래키 제약조건 위반 확인 - organizations
SELECT o.*
FROM organizations o
LEFT JOIN users u ON o.user_id = u.user_id
WHERE u.user_id IS NULL;

-- 6-2. 외래키 제약조건 위반 확인 - projects
SELECT p.*
FROM projects p
LEFT JOIN organizations o ON p.org_id = o.org_id
WHERE o.org_id IS NULL;

-- 6-3. 외래키 제약조건 위반 확인 - donations
SELECT d.*
FROM donations d
LEFT JOIN projects p ON d.project_id = p.project_id
WHERE p.project_id IS NULL;

-- 6-4. 외래키 제약조건 위반 확인 - expenses
SELECT e.*
FROM expenses e
LEFT JOIN projects p ON e.project_id = p.project_id
WHERE p.project_id IS NULL;

-- 6-5. 프로젝트 금액 불일치 확인
SELECT
    p.project_id,
    p.title,
    p.current_amount as '프로젝트_금액',
    COALESCE(SUM(d.amount), 0) as '후원_합계',
    (p.current_amount - COALESCE(SUM(d.amount), 0)) as '차이'
FROM projects p
LEFT JOIN donations d ON p.project_id = d.project_id
GROUP BY p.project_id, p.title, p.current_amount
HAVING ABS(p.current_amount - COALESCE(SUM(d.amount), 0)) > 0.01;

-- ================================================
-- 7. 긴급 관리자 계정 생성
-- ================================================

-- 7-1. 임시 관리자 계정 생성 (비밀번호: Admin123!)
-- 주의: 실제 운영 환경에서는 BCrypt로 해시된 비밀번호 사용 필요
INSERT INTO users (email, password, user_name, user_type, status)
VALUES (
    'emergency@wenect.com',
    '$2a$10$YourBCryptHashedPasswordHere', -- BCrypt 해시 필요
    '긴급관리자',
    'ADMIN',
    'ACTIVE'
)
ON DUPLICATE KEY UPDATE status = 'ACTIVE';

-- 7-2. 기존 관리자 목록 확인
SELECT
    user_id,
    email,
    user_name,
    status,
    created_at
FROM users
WHERE user_type = 'ADMIN';

-- ================================================
-- 8. 성능 모니터링
-- ================================================

-- 8-1. 느린 쿼리 확인
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 8-2. 인덱스 사용률 확인
SELECT
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mydb'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 8-3. 테이블 상태 확인
SHOW TABLE STATUS FROM mydb;

-- ================================================
-- 9. 긴급 데이터 수정
-- ================================================

-- 9-1. 모든 사용자 비밀번호 리셋 (긴급 상황)
-- UPDATE users SET password = '$2a$10$DefaultResetPasswordHash' WHERE user_type != 'ADMIN';

-- 9-2. 특정 사용자 활성화
-- UPDATE users SET status = 'ACTIVE' WHERE email = 'user@example.com';

-- 9-3. 프로젝트 상태 강제 변경
-- UPDATE projects SET status = 'COMPLETED' WHERE end_date < CURDATE() AND status = 'ACTIVE';

-- ================================================
-- 10. 트랜잭션 롤백 테스트
-- ================================================

-- 트랜잭션 시작
START TRANSACTION;

-- 테스트 데이터 삽입
INSERT INTO users (email, password, user_name, user_type)
VALUES ('test@rollback.com', 'test', '테스트사용자', 'INDIVIDUAL');

-- 확인
SELECT * FROM users WHERE email = 'test@rollback.com';

-- 롤백 (변경사항 취소)
ROLLBACK;

-- 롤백 확인 (데이터가 없어야 함)
SELECT * FROM users WHERE email = 'test@rollback.com';
