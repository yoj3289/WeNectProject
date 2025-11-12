package com.wenect.donation_paltform.domain.project.repository;

import com.wenect.donation_paltform.domain.project.entity.ProjectImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectImageRepository extends JpaRepository<ProjectImage, Long> {

    // 프로젝트 ID로 이미지 조회
    List<ProjectImage> findByProjectIdOrderByDisplayOrder(Long projectId);

    // 프로젝트 ID로 이미지 삭제
    void deleteByProjectId(Long projectId);
}
