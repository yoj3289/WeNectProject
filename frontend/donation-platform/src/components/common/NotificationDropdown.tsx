import React, { useState } from 'react';
import { Bell, X, CheckCheck, Heart, MessageCircle, TrendingUp, Calendar, DollarSign, AlertCircle, Settings, Trash2, ChevronRight, Star, ExternalLink, Mail, Smartphone, Monitor } from 'lucide-react';
import type { Notification } from '../../types';

interface NotificationDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
  onOpenFullPage: () => void;
  notificationSettings: Record<string, { enabled: boolean; email: boolean; sms: boolean; push: boolean }>;
  onUpdateSettings: (settings: Record<string, { enabled: boolean; email: boolean; sms: boolean; push: boolean }>) => void;
  onShowConsentModal: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onOpenFullPage,
  notificationSettings,
  onUpdateSettings,
  onShowConsentModal
}) => {
  const [showSettings, setShowSettings] = useState(false);

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
    onMarkAsRead(notification.id);
    if (notification.link) {
      console.log('Navigate to:', notification.link);
      alert(`페이지로 이동: ${notification.link}`);
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
                  onClick={onMarkAllAsRead}
                  className="text-white/90 hover:text-white text-sm font-medium flex items-center gap-1"
                >
                  <CheckCheck size={16} />
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 알림 설정 패널 */}
        {showSettings && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-gray-700">알림 설정</h4>
              <button
                onClick={onShowConsentModal}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                수신 동의 관리
              </button>
            </div>
            <div className="space-y-2">
              {[
                { key: 'donation', label: '기부 알림' },
                { key: 'comment', label: '댓글/답글 알림' },
                { key: 'project', label: '프로젝트 알림' },
                { key: 'settlement', label: '정산 알림' },
                { key: 'deadline', label: '마감 임박 알림' }
              ].map(setting => (
                <label key={setting.key} className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-lg">
                  <span className="text-sm text-gray-700">{setting.label}</span>
                  <input
                    type="checkbox"
                    checked={notificationSettings[setting.key]?.enabled}
                    onChange={() => onUpdateSettings({
                      ...notificationSettings,
                      [setting.key]: {
                        ...notificationSettings[setting.key],
                        enabled: !notificationSettings[setting.key]?.enabled
                      }
                    })}
                    className="w-4 h-4 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                  />
                </label>
              ))}
            </div>
            <button
              onClick={requestPushPermission}
              className="w-full mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
            >
              푸시 알림 권한 요청
            </button>
          </div>
        )}

        {/* 알림 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {visibleNotifications.length === 0 ? (
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
                                onDelete(notification.id);
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
