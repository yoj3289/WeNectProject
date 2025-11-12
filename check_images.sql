-- 프로젝트 이미지 데이터 확인
SELECT 
    pi.image_id,
    pi.project_id,
    p.title as project_title,
    pi.file_path,
    pi.file_name,
    pi.is_thumbnail,
    pi.display_order
FROM project_images pi
LEFT JOIN projects p ON pi.project_id = p.project_id
ORDER BY pi.project_id, pi.display_order
LIMIT 10;
