import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Home, Menu } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeMenu,
  setActiveMenu,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // 모바일에서는 기본적으로 닫혀있고, 데스크톱에서는 열려있음
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user, logout } = useAuth();

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // URL 경로를 기반으로 activeMenu 자동 업데이트
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) {
      setActiveMenu('dashboard');
    } else if (path.includes('/admin/organizations')) {
      setActiveMenu('organizations');
    } else if (path.includes('/admin/projects')) {
      setActiveMenu('projects');
    } else if (path.includes('/admin/users')) {
      setActiveMenu('users');
    } else if (path.includes('/admin/settlements')) {
      setActiveMenu('settlements');
    } else if (path.includes('/admin/expenses')) {
      setActiveMenu('expenses');
    } else if (path.includes('/admin/reports')) {
      setActiveMenu('reports');
    } else if (path.includes('/admin/settings')) {
      setActiveMenu('settings');
    }
  }, [location.pathname, setActiveMenu]);

  // 사용자 타입에 따른 레이블 결정
  const getUserTypeLabel = () => {
    if (!user) return '게스트';

    switch (user.userType) {
      case 'admin':
        return '관리자';
      case 'organization':
        return '기관 관리자';
      case 'individual':
        return '일반 회원';
      default:
        return '사용자';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        type="admin"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      {/* 관리자 헤더 */}
      <div className={`fixed top-0 right-0 left-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} bg-white border-b border-gray-200 z-10 transition-all duration-300`}>
        <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu size={20} className="text-gray-700" />
            </button>
            <h1 className="text-base md:text-xl lg:text-2xl font-bold text-gray-800">관리자 대시보드</h1>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4">
            {/* 홈으로 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Home size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="text-xs md:text-sm font-medium hidden sm:inline">메인으로</span>
            </button>

            {/* 알림 */}
            <button className="relative p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={18} className="text-gray-600 md:w-5 md:h-5" />
              <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 프로필 */}
            <div className="flex items-center gap-1.5 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-xs md:text-sm font-medium text-gray-800">{getUserTypeLabel()}</p>
                <p className="text-xs text-gray-500">{user?.email || 'guest@example.com'}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white md:w-5 md:h-5" />
              </div>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="로그아웃"
            >
              <LogOut size={18} className="text-gray-600 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className={`pt-14 md:pt-16 lg:pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
