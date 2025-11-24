import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Bell, User, LogOut } from 'lucide-react';
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

  // 251027추가
  const handleShowConsentModal = () => {
    // 수신 동의 모달을 여는 로직
    console.log('수신 동의 모달 열기');
    alert('수신 동의 모달 (구현 예정)');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 flex items-center justify-between gap-2 md:gap-4">
        {/* 로고 */}
        <Link
          to="/"
          className="flex items-center gap-1 md:gap-2 flex-shrink-0"
        >
          <Heart className="text-red-500" size={24} fill="currentColor" />
          <span className="text-lg md:text-xl lg:text-2xl font-bold">위넥트</span>
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center gap-3 md:gap-6 lg:gap-8">
          <Link
            to="/projects"
            className="text-sm md:text-base lg:text-lg font-semibold hover:text-red-500 transition-colors whitespace-nowrap"
          >
            프로젝트
          </Link>
          <Link
            to="/community"
            className="text-sm md:text-base lg:text-lg font-semibold hover:text-red-500 transition-colors whitespace-nowrap"
          >
            커뮤니티
          </Link>
          {isLoggedIn && userType === 'admin' && (
            <Link
              to="/admin"
              className="text-sm md:text-base lg:text-lg font-semibold hover:text-red-500 transition-colors whitespace-nowrap"
            >
              관리자
            </Link>
          )}
        </nav>

        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-1 md:gap-2 lg:gap-4 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {/* 알림 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell size={20} className="md:w-6 md:h-6" />
                  {unreadData && unreadData.count > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadData.count}
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
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 lg:px-4 py-1.5 md:py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={20} className="md:w-6 md:h-6 flex-shrink-0" />
                <span className="font-semibold text-sm md:text-base whitespace-nowrap">{userProfile.name}</span>
              </Link>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="로그아웃"
              >
                <LogOut size={20} className="md:w-6 md:h-6" />
              </button>
            </>
          ) : (
            /* 로그인 버튼 */
            <Link
              to="/login"
              className="px-3 py-2 md:px-4 md:py-2.5 lg:px-6 lg:py-3 text-sm md:text-base font-semibold hover:bg-gray-100 rounded-lg transition-colors inline-block whitespace-nowrap"
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
