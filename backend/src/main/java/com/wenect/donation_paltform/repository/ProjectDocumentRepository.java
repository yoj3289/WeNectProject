package com.wenect.donation_paltform.repository;

import com.wenect.donation_paltform.entity.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {

    // 프로젝트 ID로 문서 조회
    List<ProjectDocument> findByProjectId(Long projectId);

    // 프로젝트 ID와 문서 타입으로 조회
    List<ProjectDocument> findByProjectIdAndDocumentType(Long projectId, ProjectDocument.DocumentType documentType);

    // 프로젝트 ID로 문서 삭제
    void deleteByProjectId(Long projectId);
}
