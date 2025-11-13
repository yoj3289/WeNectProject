package com.wenect.donation_paltform.domain.notification.repository;

import com.wenect.donation_paltform.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * 특정 사용자의 알림 목록 조회 (최신순)
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 특정 사용자의 읽지 않은 알림 개수
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * 특정 사용자의 읽지 않은 알림 목록
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * 특정 사용자의 보관되지 않은 알림 목록
     */
    List<Notification> findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(Long userId);
}
