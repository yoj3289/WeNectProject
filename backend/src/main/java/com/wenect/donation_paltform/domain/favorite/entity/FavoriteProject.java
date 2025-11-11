package com.wenect.donation_paltform.domain.favorite.entity;

import com.wenect.donation_paltform.domain.project.entity.Project;
import com.wenect.donation_paltform.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자 관심 프로젝트 엔티티
 * - 사용자가 관심 등록한 프로젝트 관리
 * - User와 Project의 다대다 관계를 풀어낸 중간 테이블
 */
@Entity
@Table(
        name = "favorite_projects",
        uniqueConstraints = @UniqueConstraint(name = "UK_favorite_user_project", columnNames = {"user_id", "project_id"}),
        indexes = {
                @Index(name = "IDX_favorite_user", columnList = "user_id, created_at DESC"),
                @Index(name = "IDX_favorite_project", columnList = "project_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class FavoriteProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "favorite_id")
    private Long favoriteId;

    /**
     * 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 프로젝트
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /**
     * 등록일시
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 관심 프로젝트 생성
     */
    public static FavoriteProject create(User user, Project project) {
        return FavoriteProject.builder()
                .user(user)
                .project(project)
                .build();
    }
}
