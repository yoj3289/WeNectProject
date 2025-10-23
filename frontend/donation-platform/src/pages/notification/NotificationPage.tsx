import React, { useState } from 'react';
import { Bell, Search, CheckCheck, Archive, Trash2, Heart, MessageCircle, TrendingUp, Calendar, DollarSign, AlertCircle, X as XIcon, Settings, ArrowLeft, Star, ExternalLink, Mail, Smartphone, Monitor, FileText, Filter } from 'lucide-react';
import type { Notification } from '../../types';

interface NotificationPageProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onBack: () => void;
  notificationSettings: Record<string, { enabled: boolean; email: boolean; sms: boolean; push: boolean }>;
  onUpdateSettings: (settings: Record<string, { enabled: boolean; email: boolean; sms: boolean; push: boolean }>) => void;
  onShowConsentModal: () => void;
  onShowHistoryModal: () => void;
}

const NotificationPage: React.FC<NotificationPageProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
  onBack,
  notificationSettings,
  onUpdateSettings,
  onShowConsentModal,
  onShowHistoryModal
}) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [dateFilter, setDateFilter] = useState('all');
  const [groupByProject, setGroupByProject] = useState(false);

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

    return timestamp.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 24 };
    switch (type) {
      case 'donation':
        return {
          icon: <Heart {...iconProps} />,
          gradient: 'from-red-500 to-red-600',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          label: '기부'
        };
      case 'comment':
      case 'reply':
        return {
          icon: <MessageCircle {...iconProps} />,
          gradient: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          label: '댓글'
        };
      case 'project_approval':
        return {
          icon: <CheckCheck {...iconProps} />,
          gradient: 'from-green-500 to-green-600',
          bgColor: 'bg-green-50',
          textColor: 'text-green-600',
          label: '승인'
        };
      case 'project_rejection':
        return {
          icon: <XIcon {...iconProps} />,
          gradient: 'from-red-500 to-red-600',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          label: '반려'
        };
      case 'goal_achieved':
        return {
          icon: <TrendingUp {...iconProps} />,
          gradient: 'from-purple-500 to-purple-600',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          label: '달성'
        };
      case 'deadline_soon':
        return {
          icon: <Calendar {...iconProps} />,
          gradient: 'from-orange-500 to-orange-600',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          label: '마감임박'
        };
      case 'settlement':
        return {
          icon: <DollarSign {...iconProps} />,
          gradient: 'from-emerald-500 to-emerald-600',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-600',
          label: '정산'
        };
      default:
        return {
          icon: <AlertCircle {...iconProps} />,
          gradient: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          label: '알림'
        };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedTab === 'unread' && n.isRead) return false;
    if (selectedTab === 'archived' && !n.isArchived) return false;
    if (selectedTab !== 'archived' && n.isArchived) return false;
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 날짜 필터
    if (dateFilter !== 'all') {
      const now = new Date();
      const notifDate = new Date(n.timestamp);
      const diffDays = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dateFilter === 'today' && diffDays !== 0) return false;
      if (dateFilter === 'week' && diffDays > 7) return false;
      if (dateFilter === 'month' && diffDays > 30) return false;
    }

    return true;
  });

  // 알림 그룹화
  const groupedNotifications = groupByProject
    ? filteredNotifications.reduce((groups, notif) => {
      const projectName = notif.metadata?.projectName || '기타';
      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(notif);
      return groups;
    }, {} as Record<string, Notification[]>)
    : { '전체': filteredNotifications };

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  const toggleSelectNotification = (id: number) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const deleteSelected = () => {
    selectedNotifications.forEach(id => onDelete(id));
    setSelectedNotifications(new Set());
  };

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    if (notification.link) {
      console.log('Navigate to:', notification.link);
      alert(`페이지로 이동: ${notification.link}`);
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

  const categories = [
    { id: 'all', label: '전체', icon: <Bell size={16} /> },
    { id: 'donation', label: '기부', icon: <Heart size={16} /> },
    { id: 'community', label: '커뮤니티', icon: <MessageCircle size={16} /> },
    { id: 'project', label: '프로젝트', icon: <CheckCheck size={16} /> },
    { id: 'settlement', label: '정산', icon: <DollarSign size={16} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-red-500 text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft size={28} />
              </button>
              <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
                <Bell size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold mb-1">알림 센터</h1>
                <p className="text-red-100">
                  {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onShowHistoryModal}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-sm font-medium"
              >
                발송 내역
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 hover:bg-white/20 rounded-xl transition-colors"
              >
                <Settings size={28} />
              </button>
            </div>
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
            <input
              type="text"
              placeholder="알림 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/20 border-2 border-white/40 rounded-xl text-white placeholder-white/70 focus:bg-white/30 focus:border-white transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽 사이드바 */}
          <div className="col-span-3 space-y-4">
            {/* 탭 */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h3 className="font-bold text-sm text-gray-500 mb-3 uppercase">필터</h3>
              <div className="space-y-1">
                {[
                  { id: 'all', label: '전체 알림', count: notifications.filter(n => !n.isArchived).length },
                  { id: 'unread', label: '읽지 않음', count: unreadCount },
                  { id: 'archived', label: '보관함', count: notifications.filter(n => n.isArchived).length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${selectedTab === tab.id
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-sm ${selectedTab === tab.id ? 'text-white/90' : 'text-gray-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜 필터 */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h3 className="font-bold text-sm text-gray-500 mb-3 uppercase">기간</h3>
              <div className="space-y-1">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'today', label: '오늘' },
                  { id: 'week', label: '최근 1주일' },
                  { id: 'month', label: '최근 1개월' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setDateFilter(filter.id)}
                    className={`w-full flex items-center px-4 py-2.5 rounded-xl font-medium transition-all ${dateFilter === filter.id
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h3 className="font-bold text-sm text-gray-500 mb-3 uppercase">카테고리</h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all ${selectedCategory === cat.id
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 그룹화 옵션 */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700">프로젝트별 그룹화</span>
                <input
                  type="checkbox"
                  checked={groupByProject}
                  onChange={() => setGroupByProject(!groupByProject)}
                  className="w-4 h-4 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                />
              </label>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="col-span-9">
            {/* 액션 바 */}
            <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedNotifications.size > 0 && (
                    <>
                      <span className="text-sm font-medium text-gray-600">
                        {selectedNotifications.size}개 선택됨
                      </span>
                      <button
                        onClick={deleteSelected}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        삭제
                      </button>
                    </>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <CheckCheck size={16} />
                    모두 읽음
                  </button>
                )}
              </div>
            </div>

            {/* 알림 설정 패널 */}
            {showSettings && (
              <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">알림 설정</h3>
                  <button
                    onClick={onShowConsentModal}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                  >
                    수신 동의 관리
                  </button>
                </div>
                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, settings]) => (
                    <div key={key} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 font-medium text-gray-900">
                          <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={() => onUpdateSettings({
                              ...notificationSettings,
                              [key]: { ...settings, enabled: !settings.enabled }
                            })}
                            className="w-5 h-5 text-red-500 rounded focus:ring-2 focus:ring-red-500"
                          />
                          {key === 'donation' && '기부 알림'}
                          {key === 'comment' && '댓글/답글 알림'}
                          {key === 'project' && '프로젝트 알림'}
                          {key === 'settlement' && '정산 알림'}
                          {key === 'deadline' && '마감 임박 알림'}
                        </label>
                      </div>
                      {settings.enabled && (
                        <div className="ml-7 flex gap-6 text-sm">
                          <label className="flex items-center gap-2 text-gray-600">
                            <input
                              type="checkbox"
                              checked={settings.email}
                              onChange={() => onUpdateSettings({
                                ...notificationSettings,
                                [key]: { ...settings, email: !settings.email }
                              })}
                              className="w-4 h-4 text-red-500 rounded"
                            />
                            <Mail size={16} />
                            이메일
                          </label>
                          <label className="flex items-center gap-2 text-gray-600">
                            <input
                              type="checkbox"
                              checked={settings.sms}
                              onChange={() => onUpdateSettings({
                                ...notificationSettings,
                                [key]: { ...settings, sms: !settings.sms }
                              })}
                              className="w-4 h-4 text-red-500 rounded"
                            />
                            <Smartphone size={16} />
                            SMS
                          </label>
                          <label className="flex items-center gap-2 text-gray-600">
                            <input
                              type="checkbox"
                              checked={settings.push}
                              onChange={() => onUpdateSettings({
                                ...notificationSettings,
                                [key]: { ...settings, push: !settings.push }
                              })}
                              className="w-4 h-4 text-red-500 rounded"
                            />
                            <Monitor size={16} />
                            푸시
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={requestPushPermission}
                  className="w-full mt-4 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                >
                  푸시 알림 권한 요청
                </button>
              </div>
            )}

            {/* 알림 목록 */}
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <Bell className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">알림이 없습니다</h3>
                <p className="text-gray-500">
                  {searchQuery ? '검색 결과가 없습니다' : '새로운 알림이 오면 여기에 표시됩니다'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                  <div key={groupName}>
                    {groupByProject && (
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        {groupName}
                        <span className="text-sm font-normal text-gray-500">({groupNotifications.length})</span>
                      </h4>
                    )}
                    <div className="space-y-4">
                      {groupNotifications.map(notification => {
                        const config = getNotificationIcon(notification.type);
                        const isSelected = selectedNotifications.has(notification.id);
                        const priority = notification.metadata?.priority || 'normal';
                        return (
                          <div
                            key={notification.id}
                            className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 ${!notification.isRead ? 'border-red-200' : 'border-transparent'
                              } ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                          >
                            <div className="p-6">
                              <div className="flex gap-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectNotification(notification.id)}
                                  className="w-5 h-5 text-red-500 rounded focus:ring-2 focus:ring-red-500 cursor-pointer mt-1"
                                />

                                <div className={`bg-gradient-to-br ${config.gradient} w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg relative`}>
                                  {config.icon}
                                  {priority === 'high' && (
                                    <Star size={16} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className={`font-bold text-lg ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {notification.title}
                                      </h4>
                                      {!notification.isRead && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                          NEW
                                        </span>
                                      )}
                                      <span className={`px-2 py-0.5 ${config.bgColor} ${config.textColor} text-xs font-bold rounded-lg`}>
                                        {config.label}
                                      </span>
                                      {priority === 'high' && (
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs font-bold rounded-lg">
                                          중요
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-gray-600 mb-4 leading-relaxed">
                                    {notification.message}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">
                                      {getTimeAgo(notification.timestamp)}
                                    </span>
                                    <div className="flex gap-2">
                                      {notification.link && (
                                        <button
                                          onClick={() => handleNotificationClick(notification)}
                                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center gap-1"
                                        >
                                          <ExternalLink size={12} />
                                          바로가기
                                        </button>
                                      )}
                                      {!notification.isRead && (
                                        <button
                                          onClick={() => onMarkAsRead(notification.id)}
                                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                        >
                                          읽음 표시
                                        </button>
                                      )}
                                      <button
                                        onClick={() => onArchive(notification.id)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                      >
                                        <Archive size={16} className="text-gray-500" />
                                      </button>
                                      <button
                                        onClick={() => onDelete(notification.id)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16} className="text-gray-500" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
