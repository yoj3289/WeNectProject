import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Home } from 'lucide-react';
import Sidebar from '../components/common/Sidebar';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      <div className={`fixed top-0 right-0 left-0 ${sidebarOpen ? 'ml-64' : 'ml-20'} bg-white border-b border-gray-200 z-10 transition-all duration-300`}>
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">관리자 대시보드</h1>

          <div className="flex items-center gap-4">
            {/* 홈으로 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors"
            >
              <Home size={18} />
              <span className="font-medium">메인으로</span>
            </button>

            {/* 알림 */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 프로필 */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">관리자</p>
                <p className="text-xs text-gray-500">admin@wenect.com</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            </div>

            {/* 로그아웃 */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className={`pt-20 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
