import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 실제 API에서 읽지 않은 알림 개수 가져오기
  const { data: unreadData } = useUnreadCount();

  // 251027추가
  const handleShowConsentModal = () => {
    // 수신 동의 모달을 여는 로직
    console.log('수신 동의 모달 열기');
    alert('수신 동의 모달 (구현 예정)');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
        {/* 로고 */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Heart className="text-red-500" size={32} fill="currentColor" />
          <span className="text-2xl font-bold">위넥트</span>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center gap-8">
          <button
            onClick={() => navigate('/projects')}
            className="text-lg font-semibold hover:text-red-500 transition-colors"
          >
            프로젝트
          </button>
          <button
            onClick={() => navigate('/community')}
            className="text-lg font-semibold hover:text-red-500 transition-colors"
          >
            커뮤니티
          </button>
          {isLoggedIn && userType === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
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
                  {unreadData && unreadData.count > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadData.count}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onOpenFullPage={() => navigate('/notifications')}
                  onShowConsentModal={handleShowConsentModal}
                />
              </div>

              {/* 마이페이지 버튼 */}
              <button
                onClick={() => navigate('/profile')}
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
              onClick={() => navigate('/login')}
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
