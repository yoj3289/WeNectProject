package com.wenect.donation_paltform.domain.project.repository;

import com.wenect.donation_paltform.domain.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // 기관 ID로 프로젝트 조회
    List<Project> findByOrgId(Long orgId);

    // 상태별 프로젝트 조회
    List<Project> findByStatus(Project.ProjectStatus status);

    // 카테고리별 프로젝트 조회
    List<Project> findByCategoryId(Integer categoryId);

    // 제목으로 검색 (대소문자 무시, 부분 일치)
    List<Project> findByTitleContainingIgnoreCase(String keyword);

    // 상태와 제목으로 검색
    List<Project> findByStatusAndTitleContainingIgnoreCase(Project.ProjectStatus status, String keyword);

    // 상태와 카테고리로 검색
    List<Project> findByStatusAndCategoryId(Project.ProjectStatus status, Integer categoryId);

    // 상태, 카테고리, 제목으로 검색
    List<Project> findByStatusAndCategoryIdAndTitleContainingIgnoreCase(
            Project.ProjectStatus status, Integer categoryId, String keyword);
}
