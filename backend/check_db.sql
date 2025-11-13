-- donations 테이블 구조 확인
DESCRIBE donations;

-- donation_options 테이블 존재 여부 확인
SHOW TABLES LIKE 'donation_options';

-- donations 테이블의 외래키 제약조건 확인
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = 'mydb'
    AND TABLE_NAME = 'donations'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- donations 테이블의 데이터 개수 확인
SELECT COUNT(*) as total_donations FROM donations;

-- selected_option_id 컬럼에 값이 있는 데이터 확인
SELECT 
    COUNT(*) as donations_with_option,
    COUNT(CASE WHEN selected_option_id IS NOT NULL THEN 1 END) as has_option_id
FROM donations;
