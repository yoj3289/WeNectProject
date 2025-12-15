import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  FolderCheck,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Building2,
  Heart,
  Flag
} from 'lucide-react';
import type { UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';

// Sidebar Props Interface
interface SidebarProps {
  // 공통 props
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // 관리자 사이드바용 props
  activeMenu?: string;
  setActiveMenu?: (menu: string) => void;

  // 일반 사용자 사이드바용 props
  userType?: UserType;
  setCurrentPage?: (page: string) => void;

  // 사이드바 타입
  type: 'admin' | 'user';
}

// 관리자 메뉴 아이템 타입
interface AdminMenuItem {
  id: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  allowedUserTypes?: UserType[]; // 특정 사용자 타입만 접근 가능
}

// 일반 사용자 메뉴 섹션 타입
interface UserMenuSection {
  title: string;
  items: {
    id: string;
    label: string;
    onClick: () => void;
  }[];
}

// 관리자 사이드바 컴포넌트
export const AdminSidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeMenu = 'dashboard',
  setActiveMenu = () => {},
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserType = user?.userType || 'individual';

  const menuItems: AdminMenuItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
    { id: 'organizations', icon: Building2, label: '기관 승인', allowedUserTypes: ['admin'] },
    // { id: 'projects', icon: FolderCheck, label: '프로젝트 승인', allowedUserTypes: ['admin'] }, // 비활성화 (기능은 유지)
    { id: 'users', icon: Users, label: '사용자 관리', allowedUserTypes: ['admin'] },
    { id: 'donations', icon: Heart, label: '기부 관리', allowedUserTypes: ['admin'] },
    { id: 'settlements', icon: DollarSign, label: '정산 관리' },
    { id: 'expenses', icon: DollarSign, label: '지출 승인' },
    { id: 'reports', icon: Flag, label: '신고 관리', allowedUserTypes: ['admin'] },
    //{ id: 'settings', icon: Settings, label: '설정', allowedUserTypes: ['admin'] }, //비활성화
  ];

  // 현재 사용자가 접근 가능한 메뉴만 필터링
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.allowedUserTypes) return true; // allowedUserTypes가 없으면 모두 접근 가능
    return item.allowedUserTypes.includes(currentUserType);
  });

  return (
    <>
      {/* 모바일 오버레이 배경 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`fixed left-0 top-0 h-screen bg-stone-800 text-white transition-all duration-300 z-40 ${
        sidebarOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'
      }`}>
        {/* 헤더 */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-base md:text-xl font-bold">위넥트 관리자</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-stone-700 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  navigate(`/admin/${item.id}`);
                  // 모바일에서는 메뉴 클릭 후 사이드바 닫기
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeMenu === item.id
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-300 hover:bg-stone-700'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm md:text-base font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// 일반 사용자 사이드바 컴포넌트 (마이페이지용)
export const UserSidebar: React.FC<SidebarProps> = ({
  userType = 'individual',
  setCurrentPage = () => {},
}) => {
  const profileSection: UserMenuSection = {
    title: '프로필',
    items: [
      { id: 'profile-edit', label: '기본 정보 수정', onClick: () => setCurrentPage('profile-edit') },
      { id: 'password', label: '비밀번호 변경', onClick: () => {} }, // 모달 처리는 부모 컴포넌트에서
    ],
  };

  const activitySection: UserMenuSection = {
    title: '나의 활동',
    items: [
      { id: 'donation-history', label: '기부 내역', onClick: () => setCurrentPage('donation-history') },
      { id: 'favorite-projects', label: '관심 프로젝트', onClick: () => setCurrentPage('favorite-projects') },
    ],
  };

  const organizationSection: UserMenuSection = {
    title: '내 프로젝트',
    items: [
      { id: 'create-project', label: '프로젝트 등록', onClick: () => setCurrentPage('create-project') },
      { id: 'piggy-bank', label: '저금통 관리', onClick: () => setCurrentPage('piggy-bank') },
    ],
  };

  const renderSection = (section: UserMenuSection) => (
    <div>
      <h3 className="text-xl font-bold mb-6">{section.title}</h3>
      <div className="space-y-2">
        {section.items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {renderSection(profileSection)}

      <div className="mt-8 pt-8 border-t border-gray-200">
        {renderSection(activitySection)}
      </div>

      {userType === 'organization' && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          {renderSection(organizationSection)}
        </div>
      )}
    </div>
  );
};

// 통합 Sidebar 컴포넌트 (타입에 따라 분기)
const Sidebar: React.FC<SidebarProps> = (props) => {
  if (props.type === 'admin') {
    return <AdminSidebar {...props} />;
  } else {
    return <UserSidebar {...props} />;
  }
};

export default Sidebar;
