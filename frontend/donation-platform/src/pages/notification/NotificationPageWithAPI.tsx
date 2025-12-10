import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, CheckCheck, Archive, Trash2, Heart, MessageCircle, TrendingUp, Calendar, DollarSign, AlertCircle, X as XIcon, Settings, ArrowLeft, Star, ExternalLink, Loader2, Mail, Smartphone, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../../hooks/useNotifications';
import { useNotificationSettings, useUpdateNotificationSettings } from '../../hooks/useUsers';
import type { NotificationResponse } from '../../api/notifications';
import type { NotificationSettingsResponse, UpdateNotificationSettingsRequest } from '../../api/users';

const NotificationPageWithAPI: React.FC = () => {
  const navigate = useNavigate();

  // API hooks
  const { data: notificationsData, isLoading, error } = useMyNotifications();
  const { data: settingsData } = useNotificationSettings();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const updateSettingsMutation = useUpdateNotificationSettings();

  // UI states
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [dateFilter, setDateFilter] = useState('all');
  const [groupByProject, setGroupByProject] = useState(false);

  // API 데이터를 로컬 타입으로 변환
  const notifications = notificationsData?.map(n => ({
    id: n.notificationId,
    type: n.type,
    category: n.category,
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdAt),
    isRead: n.isRead,
    isArchived: false,
    link: n.link,
    metadata: n.metadata
  })) || [];

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
          gradient: 'from-amber-500 to-amber-600',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-600',
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
          gradient: 'from-stone-500 to-stone-600',
          bgColor: 'bg-stone-50',
          textColor: 'text-stone-600',
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
    }, {} as Record<string, typeof filteredNotifications>)
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
    selectedNotifications.forEach(id => {
      deleteNotificationMutation.mutate(id);
    });
    setSelectedNotifications(new Set());
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsReadMutation.mutate(notification.id);
    if (notification.link) {
      console.log('Navigate to:', notification.link);
      navigate(notification.link);
    }
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  const categories = [
    { id: 'all', label: '전체', icon: <Bell size={16} /> },
    { id: 'donation', label: '기부', icon: <Heart size={16} /> },
    { id: 'community', label: '커뮤니티', icon: <MessageCircle size={16} /> },
    { id: 'project', label: '프로젝트', icon: <CheckCheck size={16} /> },
    { id: 'settlement', label: '정산', icon: <DollarSign size={16} /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-600">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-stone-900 font-bold mb-2">알림을 불러올 수 없습니다</p>
          <p className="text-stone-600">로그인이 필요하거나 오류가 발생했습니다.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <div className="bg-stone-800 text-white py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="p-2 sm:p-3 bg-amber-500 rounded-xl sm:rounded-2xl">
                <Bell size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">알림 센터</h1>
                <p className="text-stone-400 text-sm sm:text-base">
                  {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 sm:p-3 hover:bg-stone-700 rounded-xl transition-colors"
            >
              <Settings size={24} className="sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="알림 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-stone-700 border border-stone-600 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 모바일: 가로 스크롤 필터 */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4">
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {[
              { id: 'all', label: '전체', count: notifications.filter(n => !n.isArchived).length },
              { id: 'unread', label: '읽지 않음', count: unreadCount },
              { id: 'archived', label: '보관함', count: notifications.filter(n => n.isArchived).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedTab === tab.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-stone-700 border border-stone-200'
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs ${selectedTab === tab.id ? 'text-white/80' : 'text-stone-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* 왼쪽 사이드바 - 데스크톱에서만 표시 */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            {/* 탭 */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <h3 className="font-bold text-sm text-stone-500 mb-3 uppercase tracking-wider">필터</h3>
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
                      ? 'bg-amber-500 text-white'
                      : 'text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-sm ${selectedTab === tab.id ? 'text-white/90' : 'text-stone-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜 필터 */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <h3 className="font-bold text-sm text-stone-500 mb-3 uppercase tracking-wider">기간</h3>
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
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <h3 className="font-bold text-sm text-stone-500 mb-3 uppercase tracking-wider">카테고리</h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all ${selectedCategory === cat.id
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-stone-700 hover:bg-stone-50'
                      }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 그룹화 옵션 */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-stone-700">프로젝트별 그룹화</span>
                <input
                  type="checkbox"
                  checked={groupByProject}
                  onChange={() => setGroupByProject(!groupByProject)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-2 focus:ring-amber-500"
                />
              </label>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-9">
            {/* 액션 바 */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedNotifications.size > 0 && (
                    <>
                      <span className="text-sm font-medium text-stone-600">
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
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg font-medium hover:bg-amber-100 transition-colors flex items-center gap-2"
                  >
                    <CheckCheck size={16} />
                    모두 읽음
                  </button>
                )}
              </div>
            </div>

            {/* 알림 목록 */}
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <Bell className="mx-auto mb-4 text-stone-300" size={64} />
                <h3 className="text-xl font-bold text-stone-900 mb-2">알림이 없습니다</h3>
                <p className="text-stone-500">
                  {searchQuery ? '검색 결과가 없습니다' : '새로운 알림이 오면 여기에 표시됩니다'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                  <div key={groupName}>
                    {groupByProject && (
                      <h4 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
                        {groupName}
                        <span className="text-sm font-normal text-stone-500">({groupNotifications.length})</span>
                      </h4>
                    )}
                    <div className="space-y-3 sm:space-y-4">
                      {groupNotifications.map(notification => {
                        const config = getNotificationIcon(notification.type);
                        const isSelected = selectedNotifications.has(notification.id);
                        const priority = notification.metadata?.priority || 'normal';
                        return (
                          <div
                            key={notification.id}
                            className={`bg-white rounded-xl sm:rounded-2xl border-2 hover:shadow-md transition-all overflow-hidden ${!notification.isRead ? 'border-amber-200' : 'border-stone-200'
                              } ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
                          >
                            <div className="p-3 sm:p-6">
                              <div className="flex gap-2 sm:gap-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectNotification(notification.id)}
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 rounded focus:ring-2 focus:ring-amber-500 cursor-pointer mt-1 flex-shrink-0"
                                />

                                <div className={`bg-gradient-to-br ${config.gradient} w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg relative`}>
                                  <span className="scale-[0.65] sm:scale-100">{config.icon}</span>
                                  {priority === 'high' && (
                                    <Star size={10} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400 sm:w-4 sm:h-4" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 overflow-hidden">
                                  {/* 제목과 배지 */}
                                  <div className="flex items-start gap-1.5 sm:gap-2 flex-wrap mb-1 sm:mb-2">
                                    <h4 className={`font-bold text-sm sm:text-lg truncate max-w-[180px] sm:max-w-none ${!notification.isRead ? 'text-stone-900' : 'text-stone-700'}`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <span className="px-1.5 sm:px-2 py-0.5 bg-amber-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex-shrink-0">
                                        NEW
                                      </span>
                                    )}
                                    <span className={`px-1.5 sm:px-2 py-0.5 ${config.bgColor} ${config.textColor} text-[10px] sm:text-xs font-bold rounded sm:rounded-lg flex-shrink-0`}>
                                      {config.label}
                                    </span>
                                    {priority === 'high' && (
                                      <span className="hidden sm:inline-block px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs font-bold rounded-lg">
                                        중요
                                      </span>
                                    )}
                                  </div>

                                  {/* 메시지 - 모바일에서 2줄 제한 */}
                                  <p className="text-stone-600 mb-2 sm:mb-4 leading-snug sm:leading-relaxed text-xs sm:text-base line-clamp-2 sm:line-clamp-none">
                                    {notification.message}
                                  </p>

                                  {/* 하단 액션 영역 */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] sm:text-sm text-stone-500 font-medium whitespace-nowrap">
                                      {getTimeAgo(notification.timestamp)}
                                    </span>
                                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                      {notification.link && (
                                        <button
                                          onClick={() => handleNotificationClick(notification)}
                                          className="p-1 sm:px-3 sm:py-1.5 text-xs bg-amber-50 text-amber-600 rounded sm:rounded-lg hover:bg-amber-100 transition-colors font-medium flex items-center gap-1"
                                        >
                                          <ExternalLink size={12} />
                                          <span className="hidden sm:inline">바로가기</span>
                                        </button>
                                      )}
                                      {!notification.isRead && (
                                        <button
                                          onClick={() => handleMarkAsRead(notification.id)}
                                          className="px-1.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-amber-50 text-amber-600 rounded sm:rounded-lg hover:bg-amber-100 transition-colors font-medium"
                                        >
                                          <span className="sm:hidden">읽음</span>
                                          <span className="hidden sm:inline">읽음 표시</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="p-1 sm:p-1.5 hover:bg-stone-100 rounded sm:rounded-lg transition-colors"
                                      >
                                        <Trash2 size={14} className="sm:w-4 sm:h-4 text-stone-500" />
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

      {/* 알림 설정 모달 */}
      {showSettings && (
        <NotificationSettingsModal
          settingsData={settingsData}
          onClose={() => setShowSettings(false)}
          onUpdate={updateSettingsMutation.mutate}
          isUpdating={updateSettingsMutation.isPending}
        />
      )}
    </div>
  );
};

// 알림 설정 모달 컴포넌트
interface NotificationSettingsModalProps {
  settingsData?: NotificationSettingsResponse;
  onClose: () => void;
  onUpdate: (data: UpdateNotificationSettingsRequest) => void;
  isUpdating: boolean;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  settingsData,
  onClose,
  onUpdate,
  isUpdating
}) => {
  // 초기값 설정
  const defaultSettings = {
    donation: { enabled: true, email: true, sms: false, push: true },
    comment: { enabled: true, email: true, sms: false, push: true },
    project: { enabled: true, email: true, sms: false, push: true },
    settlement: { enabled: true, email: true, sms: false, push: true },
    deadline: { enabled: true, email: true, sms: false, push: true },
  };

  const [settings, setSettings] = useState<NotificationSettingsResponse>(
    settingsData || defaultSettings
  );

  const settingsConfig = [
    { key: 'donation' as const, label: '기부 알림', desc: '기부 완료, 영수증 발급 등', icon: Heart },
    { key: 'comment' as const, label: '댓글 알림', desc: '새 댓글, 답글 알림', icon: MessageCircle },
    { key: 'project' as const, label: '프로젝트 알림', desc: '관심 프로젝트 업데이트', icon: TrendingUp },
    { key: 'settlement' as const, label: '정산 알림', desc: '정산 관련 알림', icon: DollarSign },
    { key: 'deadline' as const, label: '마감 알림', desc: '프로젝트 마감 임박 알림', icon: Calendar },
  ];

  const handleToggleEnabled = (key: keyof NotificationSettingsResponse) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
  };

  const handleToggleChannel = (
    key: keyof NotificationSettingsResponse,
    channel: 'email' | 'sms' | 'push'
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] }
    }));
  };

  const handleSave = () => {
    onUpdate(settings);
    toast.success('알림 설정이 저장되었습니다.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-stone-800 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Settings className="text-amber-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">알림 설정</h2>
                <p className="text-stone-400 text-sm">알림 수신 방식을 설정하세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white transition-colors"
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {settingsConfig.map((config) => {
              const setting = settings[config.key];
              const Icon = config.icon;
              return (
                <div
                  key={config.key}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    setting.enabled
                      ? 'bg-white border-amber-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  {/* 알림 유형 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        setting.enabled ? 'bg-amber-100' : 'bg-stone-200'
                      }`}>
                        <Icon size={18} className={setting.enabled ? 'text-amber-600' : 'text-stone-400'} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${setting.enabled ? 'text-stone-900' : 'text-stone-500'}`}>
                          {config.label}
                        </h4>
                        <p className="text-xs text-stone-500">{config.desc}</p>
                      </div>
                    </div>
                    {/* 전체 활성화 토글 */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        onChange={() => handleToggleEnabled(config.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* 수신 채널 선택 (활성화된 경우에만 표시) */}
                  {setting.enabled && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                      <button
                        onClick={() => handleToggleChannel(config.key, 'email')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          setting.email
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        <Mail size={14} />
                        이메일
                      </button>
                      <button
                        onClick={() => handleToggleChannel(config.key, 'sms')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          setting.sms
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        <Smartphone size={14} />
                        SMS
                      </button>
                      <button
                        onClick={() => handleToggleChannel(config.key, 'push')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          setting.push
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        <Monitor size={14} />
                        푸시
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-stone-200 bg-stone-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-stone-300 hover:bg-stone-100 rounded-xl font-medium text-stone-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 py-3 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPageWithAPI;
