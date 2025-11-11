package com.wenect.donation_paltform.domain.favorite.service;

import com.wenect.donation_paltform.domain.favorite.entity.FavoriteProject;
import com.wenect.donation_paltform.domain.favorite.repository.FavoriteProjectRepository;
import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.project.repository.ProjectRepository;
import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 관심 프로젝트 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteProjectService {

    private final FavoriteProjectRepository favoriteProjectRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    /**
     * 관심 프로젝트 토글 (있으면 삭제, 없으면 추가)
     */
    @Transactional
    public boolean toggleFavorite(Long userId, Long projectId) {
        // 사용자 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));

        // 프로젝트 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다"));

        // 이미 관심 등록되어 있으면 삭제
        Optional<FavoriteProject> existing = favoriteProjectRepository
                .findByUser_UserIdAndProject_ProjectId(userId, projectId);

        if (existing.isPresent()) {
            favoriteProjectRepository.delete(existing.get());
            return false; // 삭제됨
        } else {
            // 관심 등록
            FavoriteProject favorite = FavoriteProject.create(user, project);
            favoriteProjectRepository.save(favorite);
            return true; // 추가됨
        }
    }

    /**
     * 사용자의 관심 프로젝트 목록 조회
     */
    public List<Long> getUserFavoriteProjectIds(Long userId) {
        List<FavoriteProject> favorites = favoriteProjectRepository
                .findByUserIdOrderByCreatedAtDesc(userId);

        return favorites.stream()
                .map(f -> f.getProject().getProjectId())
                .toList();
    }

    /**
     * 관심 프로젝트 여부 확인
     */
    public boolean isFavorite(Long userId, Long projectId) {
        return favoriteProjectRepository.existsByUser_UserIdAndProject_ProjectId(userId, projectId);
    }

    /**
     * 프로젝트의 관심 등록 수 조회
     */
    public Long getFavoriteCount(Long projectId) {
        return favoriteProjectRepository.countByProjectId(projectId);
    }

    /**
     * 관심 등록 수 상위 프로젝트 ID 목록 조회
     */
    public List<Long> getTopProjectIdsByFavoriteCount(int limit) {
        List<Long> projectIds = favoriteProjectRepository.findTopProjectIdsByFavoriteCount();

        // limit만큼만 반환
        return projectIds.stream()
                .limit(limit)
                .toList();
    }
}
