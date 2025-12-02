import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Bell, User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import NotificationDropdown from './NotificationDropdown';
import type { UserType, UserProfile } from '../../types';
import { useUnreadCount } from '../../hooks/useNotifications';

interface HeaderProps {
  isLoggedIn: boolean;
  userType: UserType;
  userProfile: UserProfile;
  handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  userType,
  userProfile,
  handleLogout,
}) => {
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 실제 API에서 읽지 않은 알림 개수 가져오기 (로그인 상태일 때만)
  const { data: unreadData } = useUnreadCount(isLoggedIn);

  const handleShowConsentModal = () => {
    console.log('수신 동의 모달 열기');
    toast('수신 동의 모달 (구현 예정)', { icon: 'ℹ️' });
  };

  // 현재 경로가 활성화되어 있는지 확인
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0 group"
        >
          <Heart className="text-amber-500 group-hover:scale-110 transition-transform" size={24} fill="currentColor" />
          <span className="text-xl font-bold text-stone-800">위넥트</span>
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center gap-6">
          <Link
            to="/projects"
            className={`text-sm font-medium transition-colors ${
              isActive('/projects')
                ? 'text-amber-600'
                : 'text-stone-600 hover:text-amber-600'
            }`}
          >
            프로젝트
          </Link>
          <Link
            to="/community"
            className={`text-sm font-medium transition-colors ${
              isActive('/community')
                ? 'text-amber-600'
                : 'text-stone-600 hover:text-amber-600'
            }`}
          >
            커뮤니티
          </Link>
          {isLoggedIn && userType === 'admin' && (
            <Link
              to="/admin"
              className={`text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'text-amber-600'
                  : 'text-stone-600 hover:text-amber-600'
              }`}
            >
              관리자
            </Link>
          )}
        </nav>

        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {/* 알림 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <Bell size={20} />
                  {unreadData && unreadData.count > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadData.count > 9 ? '9+' : unreadData.count}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onOpenFullPage={() => window.location.href = '/notifications'}
                  onShowConsentModal={handleShowConsentModal}
                />
              </div>

              {/* 마이페이지 버튼 */}
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                  isActive('/profile')
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <User size={18} />
                <span className="text-sm font-medium">{userProfile.name}</span>
              </Link>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                title="로그아웃"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            /* 로그인 버튼 */
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-medium bg-amber-500 text-stone-900 hover:bg-amber-400 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
