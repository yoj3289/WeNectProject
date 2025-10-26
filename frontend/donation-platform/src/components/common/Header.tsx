import React, { useState } from 'react';
import { Heart, Bell, User, LogOut } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import type { PageType, UserType, Notification, UserProfile } from '../../types';

interface HeaderProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  isLoggedIn: boolean;
  userType: UserType;
  notifications: Notification[];
  userProfile: UserProfile;
  handleLogout: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: number) => void;
  notificationSettings: Record<string, { enabled: boolean; email: boolean; push: boolean }>;
  onUpdateNotificationSettings: (settings: Record<string, { enabled: boolean; email: boolean; push: boolean }>) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  isLoggedIn,
  userType,
  notifications,
  userProfile,
  handleLogout,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  notificationSettings,
  onUpdateNotificationSettings,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
        {/* 로고 */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCurrentPage('home')}
        >
          <Heart className="text-red-500" size={32} fill="currentColor" />
          <span className="text-2xl font-bold">위넥트 테스트 버전</span>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center gap-8">
          <button
            onClick={() => setCurrentPage('projects')}
            className="text-lg font-semibold hover:text-red-500 transition-colors"
          >
            프로젝트
          </button>
          <button
            onClick={() => setCurrentPage('community')}
            className="text-lg font-semibold hover:text-red-500 transition-colors"
          >
            커뮤니티
          </button>
          {isLoggedIn && userType === 'admin' && (
            <button
              onClick={() => setCurrentPage('admin')}
              className="text-lg font-semibold hover:text-red-500 transition-colors"
            >
              관리자
            </button>
          )}
        </nav>

        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* 알림 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell size={24} />
                  {notifications.filter(n => !n.isRead && !n.isArchived).length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.isRead && !n.isArchived).length}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  notifications={notifications}
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onDelete={onDeleteNotification}
                  onOpenFullPage={() => setCurrentPage('notifications')}
                  notificationSettings={notificationSettings}
                  onUpdateSettings={onUpdateNotificationSettings}
                />
              </div>

              {/* 마이페이지 버튼 */}
              <button
                onClick={() => setCurrentPage('mypage')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={24} />
                <span className="font-semibold">{userProfile.name}</span>
              </button>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="로그아웃"
              >
                <LogOut size={24} />
              </button>
            </>
          ) : (
            /* 로그인 버튼 */
            <button
              onClick={() => setCurrentPage('login')}
              className="px-6 py-3 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
