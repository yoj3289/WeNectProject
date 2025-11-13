package com.wenect.donation_paltform.domain.project.repository;

import com.wenect.donation_paltform.domain.project.entity.DonationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 기부 옵션 Repository
 */
@Repository
public interface DonationOptionRepository extends JpaRepository<DonationOption, Long> {

    /**
     * 프로젝트 ID로 기부 옵션 목록 조회 (활성화된 것만, 표시 순서대로)
     */
    List<DonationOption> findByProjectIdAndIsActiveTrueOrderByDisplayOrderAsc(Long projectId);

    /**
     * 프로젝트 ID로 기부 옵션 목록 조회 (전체)
     */
    List<DonationOption> findByProjectIdOrderByDisplayOrderAsc(Long projectId);

    /**
     * 프로젝트 ID로 기부 옵션 삭제
     */
    void deleteByProjectId(Long projectId);

    /**
     * 프로젝트 ID와 옵션 ID로 조회
     */
    DonationOption findByProjectIdAndOptionId(Long projectId, Long optionId);
}
