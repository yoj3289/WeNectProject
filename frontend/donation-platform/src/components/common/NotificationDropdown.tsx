import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, Heart, MessageCircle, TrendingUp, Calendar, DollarSign, AlertCircle, Settings, Trash2, ChevronRight, Star, ExternalLink, Mail, Smartphone, Monitor } from 'lucide-react';
import type { Notification } from '../../types';
import { useMyNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../../hooks/useNotifications';
import type { NotificationResponse } from '../../api/notifications';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage: () => void;
  onShowConsentModal: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onOpenFullPage,
  onShowConsentModal
}) => {
  const navigate = useNavigate();

  // 실제 API에서 알림 목록 가져오기
  const { data: notificationsData, isLoading } = useMyNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // API 응답을 컴포넌트 형식으로 변환
  const convertToNotification = (apiNotif: NotificationResponse): Notification => ({
    id: apiNotif.notificationId,
    type: apiNotif.type as any,
    category: apiNotif.category as any,
    title: apiNotif.title,
    message: apiNotif.message,
    timestamp: new Date(apiNotif.createdAt),
    isRead: apiNotif.isRead,
    isArchived: false, // API에서는 아직 지원하지 않음
    link: apiNotif.link,
    metadata: apiNotif.metadata,
  });

  const notifications: Notification[] = notificationsData?.map(convertToNotification) || [];

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 18 };
    switch (type) {
      case 'donation':
        return { icon: <Heart {...iconProps} />, color: 'bg-red-500' };
      case 'comment':
      case 'reply':
        return { icon: <MessageCircle {...iconProps} />, color: 'bg-blue-500' };
      case 'project_approval':
        return { icon: <CheckCheck {...iconProps} />, color: 'bg-green-500' };
      case 'project_rejection':
        return { icon: <X {...iconProps} />, color: 'bg-red-500' };
      case 'goal_achieved':
        return { icon: <TrendingUp {...iconProps} />, color: 'bg-purple-500' };
      case 'deadline_soon':
        return { icon: <Calendar {...iconProps} />, color: 'bg-orange-500' };
      case 'settlement':
        return { icon: <DollarSign {...iconProps} />, color: 'bg-emerald-500' };
      default:
        return { icon: <AlertCircle {...iconProps} />, color: 'bg-gray-500' };
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('푸시 알림이 허용되었습니다!');
      } else {
        alert('푸시 알림이 차단되었습니다.');
      }
    } else {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // 알림을 읽음 처리
    markAsReadMutation.mutate(notification.id);

    // 링크가 있으면 해당 페이지로 이동
    if (notification.link) {
      onClose(); // 드롭다운 닫기
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const visibleNotifications = notifications.filter(n => !n.isArchived).slice(0, 5);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* 드롭다운 */}
      <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bell size={20} />
              <h3 className="font-bold text-lg">알림</h3>
              {unreadCount > 0 && (
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-white/90 hover:text-white text-sm font-medium flex items-center gap-1"
                >
                  <CheckCheck size={16} />
                  모두 읽음
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-3"></div>
              <p className="text-gray-500">알림을 불러오는 중...</p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleNotifications.map(notification => {
                const config = getNotificationIcon(notification.type);
                const priority = notification.metadata?.priority || 'normal';
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                      !notification.isRead ? 'bg-red-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`${config.color} w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 relative`}>
                        {config.icon}
                        {priority === 'high' && (
                          <Star size={12} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-bold text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                          <div className="flex items-center gap-1">
                            {notification.link && (
                              <ExternalLink size={12} className="text-gray-400" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                            >
                              <Trash2 size={14} className="text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 - 모든 알림 보기 버튼 */}
        {visibleNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                onClose();
                onOpenFullPage();
              }}
              className="w-full text-center text-sm text-red-600 font-medium hover:text-red-700 flex items-center justify-center gap-2"
            >
              모든 알림 보기
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDropdown;
