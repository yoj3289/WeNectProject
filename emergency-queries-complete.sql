-- ================================================
-- WeNect 완전한 비상용 SQL 쿼리 모음
-- ================================================
-- 실행 방법: docker exec -i mydb mysql -uroot -p'1!DnlsprxM2@QlalfqjsgH3#' mydb < emergency-queries-complete.sql

-- ================================================
-- 1. 전체 데이터베이스 상태 확인
-- ================================================

-- 1-1. 전체 테이블 목록 및 레코드 수 (23개 테이블)
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

-- 1-3. 테이블 존재 확인 (23개 필수 테이블)
SELECT
    '필수 테이블 확인' as 구분,
    CASE
        WHEN COUNT(*) = 23 THEN CONCAT('✓ 정상 (', COUNT(*), '개)')
        ELSE CONCAT('⚠ 경고: ', COUNT(*), '개만 존재 (23개 필요)')
    END as 상태
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
AND TABLE_NAME IN (
    'users', 'organizations', 'organization_documents',
    'projects', 'project_images', 'project_documents',
    'donation_options', 'donations', 'favorite_projects',
    'piggy_banks', 'expenses', 'settlements', 'settlement_documents',
    'posts', 'post_images', 'post_likes',
    'comments', 'comment_likes', 'notifications',
    'user_deletion_logs', 'refresh_tokens', 'oauth_tokens', 'sessions'
);

-- ================================================
-- 2. 사용자 및 인증 관련 통계
-- ================================================

-- 2-1. 사용자 유형별 통계
SELECT
    '일반 사용자' as 구분,
    COUNT(*) as 수량,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as 활성,
    COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) as 정지,
    COUNT(CASE WHEN status = 'DELETED' THEN 1 END) as 삭제됨
FROM users
WHERE user_type = 'INDIVIDUAL'
UNION ALL
SELECT
    '기관 사용자',
    COUNT(*),
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END),
    COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END),
    COUNT(CASE WHEN status = 'DELETED' THEN 1 END)
FROM users
WHERE user_type = 'ORGANIZATION'
UNION ALL
SELECT
    '관리자',
    COUNT(*),
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END),
    COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END),
    COUNT(CASE WHEN status = 'DELETED' THEN 1 END)
FROM users
WHERE user_type = 'ADMIN'
UNION ALL
SELECT
    '전체',
    COUNT(*),
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END),
    COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END),
    COUNT(CASE WHEN status = 'DELETED' THEN 1 END)
FROM users;

-- 2-2. 기관 승인 상태별 통계
SELECT
    approval_status as '승인상태',
    COUNT(*) as '기관수'
FROM organizations
GROUP BY approval_status;

-- 2-3. 최근 가입 사용자 (7일)
SELECT
    COUNT(*) as '최근7일가입자수'
FROM users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- ================================================
-- 3. 프로젝트 및 후원 통계
-- ================================================

-- 3-1. 프로젝트 상태별 통계
SELECT
    status as '상태',
    COUNT(*) as '프로젝트수',
    COALESCE(SUM(target_amount), 0) as '목표금액합계',
    COALESCE(SUM(current_amount), 0) as '모금금액합계',
    ROUND(COALESCE(SUM(current_amount) / NULLIF(SUM(target_amount), 0) * 100, 0), 2) as '평균달성률'
FROM projects
GROUP BY status;

-- 3-2. 카테고리별 프로젝트 통계
SELECT
    category as '카테고리',
    COUNT(*) as '프로젝트수',
    COALESCE(SUM(current_amount), 0) as '총모금액'
FROM projects
GROUP BY category
ORDER BY 총모금액 DESC;

-- 3-3. 마감 임박 프로젝트 (7일 이내)
SELECT
    project_id,
    title,
    end_date,
    DATEDIFF(end_date, CURDATE()) as '남은일수',
    current_amount,
    target_amount,
    ROUND(current_amount / target_amount * 100, 2) as '달성률'
FROM projects
WHERE status = 'ACTIVE'
AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY end_date;

-- 3-4. 후원 통계 (월별 최근 12개월)
SELECT
    DATE_FORMAT(created_at, '%Y-%m') as '월',
    COUNT(*) as '후원건수',
    SUM(amount) as '총후원금액',
    AVG(amount) as '평균후원금액',
    COUNT(DISTINCT user_id) as '후원자수'
FROM donations
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY 월 DESC;

-- 3-5. 프로젝트별 후원자 수
SELECT
    p.project_id,
    p.title,
    COUNT(DISTINCT d.user_id) as '후원자수',
    COUNT(d.donation_id) as '후원건수',
    SUM(d.amount) as '총후원금액'
FROM projects p
LEFT JOIN donations d ON p.project_id = d.project_id
GROUP BY p.project_id, p.title
ORDER BY 총후원금액 DESC
LIMIT 10;

-- ================================================
-- 4. 저금통 및 지출 관리 통계
-- ================================================

-- 4-1. 프로젝트별 저금통 현황
SELECT
    p.project_id,
    p.title,
    pb.current_balance as '저금통잔액',
    pb.total_deposited as '총입금액',
    pb.total_withdrawn as '총출금액',
    (pb.total_deposited - pb.total_withdrawn) as '차액검증'
FROM projects p
INNER JOIN piggy_banks pb ON p.project_id = pb.project_id
ORDER BY pb.current_balance DESC;

-- 4-2. 지출 승인 상태별 통계
SELECT
    status as '상태',
    COUNT(*) as '지출건수',
    SUM(amount) as '총금액'
FROM expenses
GROUP BY status;

-- 4-3. 승인 대기중인 지출 내역
SELECT
    e.expense_id,
    p.title as '프로젝트',
    e.category,
    e.amount,
    e.description,
    e.expense_date,
    DATEDIFF(NOW(), e.created_at) as '대기일수'
FROM expenses e
INNER JOIN projects p ON e.project_id = p.project_id
WHERE e.status = 'PENDING'
ORDER BY e.created_at;

-- 4-4. 저금통 잔액 vs 지출 가능 금액 검증
SELECT
    p.project_id,
    p.title,
    pb.current_balance as '저금통잔액',
    COALESCE(SUM(CASE WHEN e.status = 'PENDING' THEN e.amount ELSE 0 END), 0) as '승인대기금액',
    (pb.current_balance - COALESCE(SUM(CASE WHEN e.status = 'PENDING' THEN e.amount ELSE 0 END), 0)) as '승인후잔액'
FROM projects p
INNER JOIN piggy_banks pb ON p.project_id = pb.project_id
LEFT JOIN expenses e ON p.project_id = e.project_id AND e.status = 'PENDING'
GROUP BY p.project_id, p.title, pb.current_balance
HAVING 승인후잔액 < 0;

-- ================================================
-- 5. 결산 관련 통계
-- ================================================

-- 5-1. 결산 상태별 통계
SELECT
    status as '결산상태',
    COUNT(*) as '프로젝트수'
FROM settlements
GROUP BY status;

-- 5-2. 결산 대상 프로젝트 (종료됐지만 결산 안됨)
SELECT
    p.project_id,
    p.title,
    p.end_date,
    DATEDIFF(NOW(), p.end_date) as '종료후일수',
    p.current_amount as '총모금액',
    pb.current_balance as '저금통잔액'
FROM projects p
INNER JOIN piggy_banks pb ON p.project_id = pb.project_id
LEFT JOIN settlements s ON p.project_id = s.project_id
WHERE p.end_date < CURDATE()
AND p.status = 'COMPLETED'
AND s.settlement_id IS NULL
ORDER BY p.end_date;

-- 5-3. 결산 완료 프로젝트
SELECT
    s.settlement_id,
    p.title,
    s.total_revenue as '총수익',
    s.total_expense as '총지출',
    s.remaining_amount as '잔액',
    s.settlement_date,
    s.status
FROM settlements s
INNER JOIN projects p ON s.project_id = p.project_id
ORDER BY s.settlement_date DESC
LIMIT 10;

-- ================================================
-- 6. 커뮤니티 관련 통계
-- ================================================

-- 6-1. 전체 커뮤니티 통계
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

-- 6-2. 게시글 유형별 통계
SELECT
    type as '게시글유형',
    COUNT(*) as '게시글수',
    AVG(view_count) as '평균조회수',
    AVG(like_count) as '평균좋아요'
FROM posts
GROUP BY type;

-- 6-3. 인기 게시글 (조회수 TOP 10)
SELECT
    post_id,
    title,
    author_id,
    view_count,
    like_count,
    created_at
FROM posts
ORDER BY view_count DESC, like_count DESC
LIMIT 10;

-- 6-4. 활동적인 사용자 (댓글 작성자 TOP 10)
SELECT
    u.user_name,
    COUNT(c.comment_id) as '댓글수',
    COUNT(DISTINCT c.post_id) as '참여게시글수'
FROM comments c
INNER JOIN users u ON c.author_id = u.user_id
GROUP BY u.user_id, u.user_name
ORDER BY 댓글수 DESC
LIMIT 10;

-- ================================================
-- 7. 알림 관련 통계
-- ================================================

-- 7-1. 알림 유형별 통계
SELECT
    type as '알림유형',
    COUNT(*) as '알림수',
    COUNT(CASE WHEN is_read = TRUE THEN 1 END) as '읽음',
    COUNT(CASE WHEN is_read = FALSE THEN 1 END) as '안읽음'
FROM notifications
GROUP BY type;

-- 7-2. 미읽은 알림 (7일 이내)
SELECT
    COUNT(*) as '최근7일미읽은알림수'
FROM notifications
WHERE is_read = FALSE
AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- ================================================
-- 8. 데이터 무결성 검증
-- ================================================

-- 8-1. 외래키 위반 - organizations (user_id)
SELECT 'organizations - user_id' as '테이블', o.*
FROM organizations o
LEFT JOIN users u ON o.user_id = u.user_id
WHERE u.user_id IS NULL;

-- 8-2. 외래키 위반 - projects (org_id)
SELECT 'projects - org_id' as '테이블', p.*
FROM projects p
LEFT JOIN organizations o ON p.org_id = o.org_id
WHERE o.org_id IS NULL;

-- 8-3. 외래키 위반 - donations (project_id, user_id)
SELECT 'donations - project_id' as '테이블', COUNT(*) as '위반건수'
FROM donations d
LEFT JOIN projects p ON d.project_id = p.project_id
WHERE p.project_id IS NULL
UNION ALL
SELECT 'donations - user_id', COUNT(*)
FROM donations d
LEFT JOIN users u ON d.user_id = u.user_id
WHERE u.user_id IS NULL;

-- 8-4. 외래키 위반 - piggy_banks (project_id)
SELECT 'piggy_banks - project_id' as '테이블', pb.*
FROM piggy_banks pb
LEFT JOIN projects p ON pb.project_id = p.project_id
WHERE p.project_id IS NULL;

-- 8-5. 외래키 위반 - expenses (project_id)
SELECT 'expenses - project_id' as '테이블', e.*
FROM expenses e
LEFT JOIN projects p ON e.project_id = p.project_id
WHERE p.project_id IS NULL;

-- 8-6. 외래키 위반 - comments (post_id, author_id)
SELECT 'comments - post_id' as '테이블', COUNT(*) as '위반건수'
FROM comments c
LEFT JOIN posts p ON c.post_id = p.post_id
WHERE p.post_id IS NULL
UNION ALL
SELECT 'comments - author_id', COUNT(*)
FROM comments c
LEFT JOIN users u ON c.author_id = u.user_id
WHERE u.user_id IS NULL;

-- 8-7. 프로젝트 금액 불일치 검증
SELECT
    p.project_id,
    p.title,
    p.current_amount as '프로젝트_현재금액',
    COALESCE(SUM(d.amount), 0) as '후원_합계금액',
    (p.current_amount - COALESCE(SUM(d.amount), 0)) as '차이'
FROM projects p
LEFT JOIN donations d ON p.project_id = d.project_id
GROUP BY p.project_id, p.title, p.current_amount
HAVING ABS(차이) > 0.01;

-- 8-8. 저금통 잔액 불일치 검증
SELECT
    pb.piggy_bank_id,
    p.title,
    pb.current_balance as '저금통잔액',
    pb.total_deposited as '총입금',
    pb.total_withdrawn as '총출금',
    (pb.total_deposited - pb.total_withdrawn) as '계산잔액',
    (pb.current_balance - (pb.total_deposited - pb.total_withdrawn)) as '차이'
FROM piggy_banks pb
INNER JOIN projects p ON pb.project_id = p.project_id
HAVING ABS(차이) > 0.01;

-- ================================================
-- 9. 긴급 데이터 수동 백업 (CSV)
-- ================================================

-- 주의: /tmp/ 디렉토리 쓰기 권한 필요
-- Docker 환경에서는 docker exec로 실행 후 docker cp로 파일 복사

-- 9-1. 사용자 데이터
-- SELECT * FROM users INTO OUTFILE '/tmp/users_backup.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';

-- 9-2. 프로젝트 데이터
-- SELECT * FROM projects INTO OUTFILE '/tmp/projects_backup.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';

-- 9-3. 후원 데이터
-- SELECT * FROM donations INTO OUTFILE '/tmp/donations_backup.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';

-- 9-4. 저금통 데이터
-- SELECT * FROM piggy_banks INTO OUTFILE '/tmp/piggy_banks_backup.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';

-- ================================================
-- 10. 긴급 데이터 정리
-- ================================================

-- 10-1. 90일 이전 삭제된 사용자 로그 정리
-- DELETE FROM user_deletion_logs WHERE deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 10-2. 읽은 알림 90일 이후 정리
-- DELETE FROM notifications WHERE is_read = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 10-3. 만료된 리프레시 토큰 정리
-- DELETE FROM refresh_tokens WHERE expires_at < NOW();

-- ================================================
-- 11. 긴급 관리자 계정 생성
-- ================================================

-- 11-1. 임시 관리자 계정 생성 (BCrypt 해시 필요)
-- 주의: 실제 사용 시 BCrypt로 해시된 비밀번호로 교체 필요
/*
INSERT INTO users (email, password, user_name, user_type, status)
VALUES (
    'emergency@wenect.com',
    '$2a$10$YourBCryptHashedPasswordHere',
    '긴급관리자',
    'ADMIN',
    'ACTIVE'
)
ON DUPLICATE KEY UPDATE status = 'ACTIVE';
*/

-- 11-2. 기존 관리자 목록 확인
SELECT
    user_id,
    email,
    user_name,
    status,
    created_at,
    updated_at
FROM users
WHERE user_type = 'ADMIN'
ORDER BY created_at;

-- ================================================
-- 12. 성능 모니터링
-- ================================================

-- 12-1. 테이블별 인덱스 현황
SELECT
    TABLE_NAME as '테이블',
    INDEX_NAME as '인덱스명',
    COLUMN_NAME as '컬럼',
    SEQ_IN_INDEX as '순서',
    NON_UNIQUE as '중복허용'
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mydb'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 12-2. 테이블 상태 확인
SHOW TABLE STATUS FROM mydb;

-- ================================================
-- 13. 즐겨찾기 및 기타 통계
-- ================================================

-- 13-1. 인기 프로젝트 (즐겨찾기 많은 순)
SELECT
    p.project_id,
    p.title,
    COUNT(fp.favorite_id) as '즐겨찾기수'
FROM projects p
LEFT JOIN favorite_projects fp ON p.project_id = fp.project_id
GROUP BY p.project_id, p.title
ORDER BY 즐겨찾기수 DESC
LIMIT 10;

-- 13-2. 사용자별 즐겨찾기 프로젝트 수
SELECT
    u.user_name,
    COUNT(fp.favorite_id) as '즐겨찾기수'
FROM users u
LEFT JOIN favorite_projects fp ON u.user_id = fp.user_id
GROUP BY u.user_id, u.user_name
ORDER BY 즐겨찾기수 DESC
LIMIT 10;

-- ================================================
-- 14. 전체 시스템 헬스체크
-- ================================================

SELECT
    '데이터베이스' as '구분',
    'mydb' as '상태',
    ROUND(SUM((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as '크기MB'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
UNION ALL
SELECT
    '사용자',
    CONCAT(COUNT(*), '명'),
    NULL
FROM users
UNION ALL
SELECT
    '프로젝트',
    CONCAT(COUNT(*), '개'),
    NULL
FROM projects
UNION ALL
SELECT
    '총후원금액',
    CONCAT(FORMAT(SUM(amount), 0), '원'),
    NULL
FROM donations
UNION ALL
SELECT
    '게시글',
    CONCAT(COUNT(*), '개'),
    NULL
FROM posts
UNION ALL
SELECT
    '댓글',
    CONCAT(COUNT(*), '개'),
    NULL
FROM comments;
