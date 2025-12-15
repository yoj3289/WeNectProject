import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { apiClient } from './lib/apiClient';

// ✅ useAuth import 추가!
import { useAuth } from './hooks/useAuth';

// Type imports
import type { UserType, Project, CommunityPost, UserProfile, AdminUser, Notification, SettlementRequest, DonationHistory, PiggyBank } from './types';

// Page imports
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ReapplyPage from './pages/auth/ReapplyPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProjectListPage from './pages/project/ProjectListPage';
import ProjectDetailContainer from './pages/project/ProjectDetailContainer';
import ProjectCreatePage from './pages/project/ProjectCreatePage';
import { useParams } from 'react-router-dom';
import BoardPage from './pages/community/BoardPage';
import PostDetailPage from './pages/community/PostDetailPage';
import EditPostPage from './pages/community/EditPostPage';
import ProfilePage from './pages/user/ProfilePage';
import IntroductionPage from './pages/IntroductionPage';
import OrganizationListPage from './pages/organization/OrganizationListPage';
import OrganizationProjectsPage from './pages/organization/OrganizationProjectsPage';
import OrganizationDashboardPage from './pages/organization/OrganizationDashboardPage';
import OrganizationProfilePage from './pages/organization/OrganizationProfilePage';
import PiggyBankManagementPage from './pages/organization/PiggyBankManagementPage';
import OrganizationProjectStatisticsPage from './pages/organization/OrganizationProjectStatisticsPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ProjectManagementPage from './pages/admin/ProjectManagementPage';
import SettlementManagementPage from './pages/admin/SettlementManagementPage';
import OrganizationApprovalPage from './pages/admin/OrganizationApprovalPage';
import ExpenseApprovalPage from './pages/admin/ExpenseApprovalPage';
import DonationManagementPage from './pages/admin/DonationManagementPage';
import ReportManagementPage from './pages/admin/ReportManagementPage';
import TestMailPage from './pages/admin/TestMailPage';
import NotificationPageWithAPI from './pages/notification/NotificationPageWithAPI';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import PaymentCancelPage from './pages/payment/PaymentCancelPage';
import PaymentFailPage from './pages/payment/PaymentFailPage';
import TossPaySuccessPage from './pages/payment/TossPaySuccessPage';
import TossPayFailPage from './pages/payment/TossPayFailPage';

// Component imports
import DonationModal from './components/donation/DonationModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';

// Layout imports
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Store import (토큰 동기화는 authStore의 onRehydrateStorage에서 자동 처리)
import { useAuthStore } from './stores/authStore';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// BrowserRouter 내부에서 사용할 컴포넌트
const AppRoutes: React.FC = () => {
  // ✅ useAuth로 실제 로그인 상태 가져오기
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  // userType은 user 객체에서 가져오기 (기본값은 'individual')
  const userType: UserType = user?.userType || 'individual';

  // JWT 토큰 만료 시 자동 로그아웃 처리
  React.useEffect(() => {
    const handleAuthLogout = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason: string; currentPath: string }>;
      const currentPath = customEvent.detail?.currentPath || window.location.pathname;

      // 로그아웃 처리 (이미 apiClient에서 처리되었지만 React Query 캐시 정리)
      logout();

      // 로그인 페이지로 리다이렉트 (현재 경로를 redirect 파라미터로 전달)
      // 로그인 후 원래 페이지로 돌아갈 수 있도록
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });

      // 사용자에게 알림 (토스트 메시지)
      toast('자동 로그아웃 되었습니다.', {
        icon: '🔒',
        duration: 4000,
      });
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [logout, navigate]);

  // 토큰 갱신 함수
  const handleRefreshToken = React.useCallback(async (toastId: string) => {
    try {
      toast.dismiss(toastId);
      const response = await apiClient.post<{
        success: boolean;
        data: { token: string };
      }>('/auth/refresh');

      if (response.success && response.data?.token) {
        // 새 토큰으로 업데이트
        const newToken = response.data.token;
        useAuthStore.getState().updateToken(newToken);
        apiClient.setToken(newToken);

        toast.success('세션이 연장되었습니다.', { duration: 3000 });
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      toast.error('세션 연장에 실패했습니다. 다시 로그인해주세요.');
    }
  }, []);

  // JWT 토큰 만료 5분 전 경고 토스트
  React.useEffect(() => {
    if (!isLoggedIn) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    // JWT 토큰 디코딩하여 만료 시간 확인
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp * 1000; // 초 → 밀리초
      const now = Date.now();
      const timeUntilExpiry = expTime - now;
      const warningTime = 5 * 60 * 1000; // 5분

      // 경고 토스트 표시 함수
      const showWarningToast = () => {
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏰</span>
                <span className="font-medium">세션이 5분 후 만료됩니다</span>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleRefreshToken(t.id)}
                  className="flex-1 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded hover:bg-amber-600 transition-colors"
                >
                  연장하기
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-1 px-3 py-1.5 bg-stone-200 text-stone-700 text-sm font-medium rounded hover:bg-stone-300 transition-colors"
                >
                  무시
                </button>
              </div>
            </div>
          ),
          { duration: 60000 } // 1분간 표시 (사용자가 선택할 때까지)
        );
      };

      // 만료까지 5분 이상 남았으면 경고 타이머 설정
      if (timeUntilExpiry > warningTime) {
        const warningTimer = setTimeout(showWarningToast, timeUntilExpiry - warningTime);
        return () => clearTimeout(warningTimer);
      } else if (timeUntilExpiry > 0) {
        // 이미 5분 미만 남았으면 즉시 경고
        showWarningToast();
      }
    } catch {
      // 토큰 파싱 실패 시 무시
    }
  }, [isLoggedIn, handleRefreshToken]);

  // UI states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

  // URL 파라미터에서 ID를 추출하는 Wrapper 컴포넌트
  const ProjectDetailContainerWrapper: React.FC<{
    isLoggedIn: boolean;
    favoriteProjectIds: Set<number>;
    onShowDonationModal: () => void;
  }> = ({ isLoggedIn, favoriteProjectIds, onShowDonationModal }) => {
    const { id } = useParams<{ id: string }>();

    return (
      <ProjectDetailContainer
        isLoggedIn={isLoggedIn}
        favoriteProjectIds={favoriteProjectIds}
        onNavigateToLogin={() => {}}
        onShowDonationModal={onShowDonationModal}
      />
    );
  };

  // 프로젝트 등록 페이지 Wrapper 컴포넌트
  const ProjectCreatePageWrapper: React.FC = () => {
    const navigate = useNavigate();

    return (
      <ProjectCreatePage
        onSubmit={() => {
          navigate('/');
        }}
      />
    );
  };

  // Project & Donation states
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<number>>(new Set([1, 2, 5]));

  // Community states
  const [uploadedImageFiles, setUploadedImageFiles] = useState<File[]>([]);
  const [postViews, setPostViews] = useState<Map<number, number>>(new Map());
  const [viewedPostIds, setViewedPostIds] = useState<Set<number>>(new Set());

  // Admin states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('all');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('all');
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedSettlements, setSelectedSettlements] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRequest | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Mock data
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { id: 1, name: '김민수', email: 'user1@example.com', type: '일반', status: 'active', registeredDate: '2024-01-15', lastLogin: '2024-03-15 14:30' },
    { id: 2, name: '희망나눔재단', email: 'hope@example.com', type: '기관', status: 'active', registeredDate: '2024-02-01', lastLogin: '2024-03-14 09:20' },
    { id: 3, name: '이영희', email: 'user2@example.com', type: '일반', status: 'inactive', registeredDate: '2024-01-20', lastLogin: '2024-02-28 18:45' }
  ]);

  // ✅ userProfile을 user 객체에서 직접 파생 (useMemo로 불필요한 재생성 방지)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user?.userName || '게스트',
    email: user?.email || '',
    phone: user?.phone || '',
    notificationSettings: { donation: true, project: true, comment: true, newsletter: false }
  });

  // user가 변경될 때마다 userProfile 업데이트
  React.useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.userName,
        email: user.email,
        phone: user.phone || '',
      }));
    } else {
      // 로그아웃 시 게스트로 재설정
      setUserProfile({
        name: '게스트',
        email: '',
        phone: '',
        notificationSettings: { donation: true, project: true, comment: true, newsletter: false }
      });
    }
  }, [user]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'donation',
      category: 'donation',
      title: '기부가 완료되었습니다',
      message: '"희망의 집 짓기" 프로젝트에 50,000원을 기부하셨습니다. 따뜻한 마음에 감사드립니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isRead: false,
      isArchived: false,
      link: '/donation-history',
      metadata: { projectName: '희망의 집 짓기', amount: '50,000원' }
    },
    {
      id: 2,
      type: 'comment',
      category: 'community',
      title: '새로운 댓글이 있습니다',
      message: '희망재단님이 "프로젝트 진행 상황 공유" 게시글에 댓글을 남겼습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: false,
      isArchived: false,
      link: '/community',
      metadata: { author: '희망재단', postTitle: '프로젝트 진행 상황 공유' }
    },
    {
      id: 3,
      type: 'project_approval',
      category: 'project',
      title: '프로젝트가 승인되었습니다',
      message: '"아이들의 미래" 프로젝트가 관리자 검토를 통과하여 승인되었습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: false,
      isArchived: false,
      link: '/projects',
      metadata: { projectName: '아이들의 미래', approver: '관리자' }
    },
    {
      id: 4,
      type: 'goal_achieved',
      category: 'project',
      title: '🎉 목표 금액 달성!',
      message: '"희망의 집 짓기" 프로젝트가 목표 금액 5,000,000원을 달성했습니다. 총 243명이 참여해주셨습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      isRead: true,
      isArchived: false,
      link: '/projects',
      metadata: { projectName: '희망의 집 짓기', donors: 243, amount: '5,000,000원' }
    },
    {
      id: 5,
      type: 'deadline_soon',
      category: 'project',
      title: '프로젝트 마감 임박',
      message: '"봄날의 따뜻함" 프로젝트가 3일 후 마감됩니다. 현재 목표의 87%를 달성했습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      isRead: true,
      isArchived: false,
      link: '/projects',
      metadata: { projectName: '봄날의 따뜻함', daysLeft: 3, progress: 87 }
    },
    {
      id: 6,
      type: 'settlement',
      category: 'settlement',
      title: '정산이 완료되었습니다',
      message: '"희망의 집 짓기" 프로젝트의 기부금 4,850,000원이 등록하신 계좌로 송금되었습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      isRead: true,
      isArchived: false,
      link: '/settlement',
      metadata: { projectName: '희망의 집 짓기', amount: '4,850,000원' }
    },
    {
      id: 7,
      type: 'reply',
      category: 'community',
      title: '새로운 답글이 있습니다',
      message: '김민수님이 회원님의 댓글에 답글을 남겼습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      isRead: true,
      isArchived: false,
      link: '/community',
      metadata: { author: '김민수' }
    },
    {
      id: 8,
      type: 'project_rejection',
      category: 'project',
      title: '프로젝트가 반려되었습니다',
      message: '"겨울나기 프로젝트"가 반려되었습니다. 사유: 서류 미비',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      isRead: true,
      isArchived: false,
      link: '/projects',
      metadata: { projectName: '겨울나기 프로젝트', reason: '서류 미비' }
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    donation: { enabled: true, email: true, sms: false, push: true },
    comment: { enabled: true, email: true, sms: false, push: true },
    project: { enabled: true, email: true, sms: false, push: false },
    settlement: { enabled: true, email: true, sms: true, push: true },
    deadline: { enabled: true, email: false, sms: false, push: true }
  });

  const projects: Project[] = [
    { id: 1, title: '소외계층 아동 급식 지원', category: '아동복지', currentAmount: 4200000, targetAmount: 5000000, dday: 15, donors: 142, image: '', description: '결식 아동들에게 영양가 있는 급식을 제공합니다.', organization: '아이사랑재단', status: 'approved', userId: 1 },
    { id: 2, title: '유기동물 보호소 운영비', category: '동물보호', currentAmount: 3150000, targetAmount: 3000000, dday: 8, donors: 89, image: '', description: '유기동물들의 치료와 보호를 위한 운영비를 모금합니다.', organization: '동물사랑협회', status: 'approved', userId: 1 },
    { id: 3, title: '독거노인 생활 지원', category: '노인복지', currentAmount: 9800000, targetAmount: 10000000, dday: 25, donors: 234, image: '', description: '홀로 지내시는 어르신들의 생활을 지원합니다.', organization: '실버케어센터', status: 'approved', userId: 1 },
    { id: 4, title: '산불 피해 지역 복구', category: '환경보호', currentAmount: 6500000, targetAmount: 15000000, dday: 45, donors: 156, image: '', description: '산불로 피해를 입은 지역의 복구를 돕습니다.', organization: '환경보호협회', status: 'approved', userId: 1 },
    { id: 5, title: '지역아동센터 운영 지원', category: '교육', currentAmount: 2800000, targetAmount: 5000000, dday: 30, donors: 78, image: '', description: '지역 아동센터의 안정적인 운영을 지원합니다.', organization: '교육나눔재단', status: 'approved', userId: 1 },
    { id: 6, title: '장애인 재활 프로그램', category: '장애인복지', currentAmount: 1500000, targetAmount: 8000000, dday: 60, donors: 45, image: '', description: '장애인들의 자립을 위한 재활 프로그램을 진행합니다.', organization: '함께하는세상', status: 'approved', userId: 1 }
  ];

  const communityPosts: CommunityPost[] = [
    { id: 1, type: 'NOTICE', title: '2024년 3월 정산 일정 안내', author: '관리자', date: '2024-03-15', views: 234 },
    { id: 2, type: 'QUESTION', title: '기부금 영수증 발급은 어떻게 하나요?', author: '김민수', date: '2024-03-14', views: 89 },
    { id: 3, type: 'SUPPORT', title: '소외계층 아동 급식 지원 프로젝트를 응원합니다!', author: '이영희', date: '2024-03-13', views: 156 }
  ];

  const donationHistory: DonationHistory[] = [
    { id: 1, projectTitle: '소외계층 아동 급식 지원', amount: 50000, date: '2024-03-15', receiptNumber: 'R2024031501', status: 'completed' },
    { id: 2, projectTitle: '유기동물 보호소 운영비', amount: 30000, date: '2024-03-10', receiptNumber: 'R2024031002', status: 'completed' },
    { id: 3, projectTitle: '독거노인 생활 지원', amount: 100000, date: '2024-02-28', receiptNumber: 'R2024022803', status: 'completed' }
  ];

  const piggyBanks: PiggyBank[] = [
    { projectId: 1, projectTitle: '독거노인 생활 지원', totalAmount: 9800000, withdrawnAmount: 0, balance: 9800000, status: 'active', lastUpdated: '2024-03-15' },
    { projectId: 2, projectTitle: '지역아동센터 운영 지원', totalAmount: 5000000, withdrawnAmount: 5000000, balance: 0, status: 'withdrawn', lastUpdated: '2024-02-28' }
  ];

  // Utility functions
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const toggleFavoriteProject = (projectId: number) => {
    const newFavorites = new Set(favoriteProjectIds);
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
      toast.success('관심 프로젝트에서 제거되었습니다.');
    } else {
      newFavorites.add(projectId);
      toast.success('관심 프로젝트에 추가되었습니다.');
    }
    setFavoriteProjectIds(newFavorites);
  };

  const incrementView = (postId: number) => {
    if (viewedPostIds.has(postId)) return;
    const newViews = new Map(postViews);
    const currentViews = newViews.get(postId) || 0;
    newViews.set(postId, currentViews + 1);
    setPostViews(newViews);
    const newViewedIds = new Set(viewedPostIds);
    newViewedIds.add(postId);
    setViewedPostIds(newViewedIds);
  };

  // ✅ handleLogout을 useAuth의 logout 함수로 변경
  const handleLogout = () => {
    logout();
    navigate('/');  // 메인 페이지로 이동
    toast.success('로그아웃되었습니다.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImageFiles.length + files.length > 5) {
      toast.error('이미지는 최대 5개까지 업로드 가능합니다.');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name}은(는) 5MB를 초과합니다.`);
        return false;
      }
      return true;
    });
    setUploadedImageFiles([...uploadedImageFiles, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImageFiles(uploadedImageFiles.filter((_, i) => i !== index));
  };

  // Notification handlers
  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleArchiveNotification = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isArchived: !n.isArchived } : n
    ));
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes - AuthLayout 내부에서 처리 */}
        <Route path="/login" element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } />
        <Route path="/signup" element={
          <AuthLayout>
            <SignupPage />
          </AuthLayout>
        } />
        <Route path="/reapply" element={
          <AuthLayout>
            <ReapplyPage />
          </AuthLayout>
        } />
        <Route path="/forgot-password" element={
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        } />

        {/* Admin Routes - AdminLayout으로 감싸기 */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedUserTypes={['admin']}>
            <AdminLayout
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            >
            <Routes>
              <Route path="dashboard" element={
                <DashboardPage
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  projectCategoryFilter={projectCategoryFilter}
                  setProjectCategoryFilter={setProjectCategoryFilter}
                  projectSearchTerm={projectSearchTerm}
                  setProjectSearchTerm={setProjectSearchTerm}
                  userTypeFilter={userTypeFilter}
                  setUserTypeFilter={setUserTypeFilter}
                  userStatusFilter={userStatusFilter}
                  setUserStatusFilter={setUserStatusFilter}
                  userSearchTerm={userSearchTerm}
                  setUserSearchTerm={setUserSearchTerm}
                  settlementFilter={settlementFilter}
                  setSettlementFilter={setSettlementFilter}
                  settlementSearchTerm={settlementSearchTerm}
                  setSettlementSearchTerm={setSettlementSearchTerm}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                  selectedSettlements={selectedSettlements}
                  setSelectedSettlements={setSelectedSettlements}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedUser={selectedUser}
                  setSelectedUser={setSelectedUser}
                  selectedSettlement={selectedSettlement}
                  setSelectedSettlement={setSelectedSettlement}
                  showProjectModal={showProjectModal}
                  setShowProjectModal={setShowProjectModal}
                  showUserModal={showUserModal}
                  setShowUserModal={setShowUserModal}
                  showSettlementModal={showSettlementModal}
                  setShowSettlementModal={setShowSettlementModal}
                  rejectReason={rejectReason}
                  setRejectReason={setRejectReason}
                  adminUsers={adminUsers}
                />
              } />
              <Route path="users" element={
                <UserManagementPage
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  projectCategoryFilter={projectCategoryFilter}
                  setProjectCategoryFilter={setProjectCategoryFilter}
                  projectSearchTerm={projectSearchTerm}
                  setProjectSearchTerm={setProjectSearchTerm}
                  userTypeFilter={userTypeFilter}
                  setUserTypeFilter={setUserTypeFilter}
                  userStatusFilter={userStatusFilter}
                  setUserStatusFilter={setUserStatusFilter}
                  userSearchTerm={userSearchTerm}
                  setUserSearchTerm={setUserSearchTerm}
                  settlementFilter={settlementFilter}
                  setSettlementFilter={setSettlementFilter}
                  settlementSearchTerm={settlementSearchTerm}
                  setSettlementSearchTerm={setSettlementSearchTerm}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                  selectedSettlements={selectedSettlements}
                  setSelectedSettlements={setSelectedSettlements}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedUser={selectedUser}
                  setSelectedUser={setSelectedUser}
                  selectedSettlement={selectedSettlement}
                  setSelectedSettlement={setSelectedSettlement}
                  showProjectModal={showProjectModal}
                  setShowProjectModal={setShowProjectModal}
                  showUserModal={showUserModal}
                  setShowUserModal={setShowUserModal}
                  showSettlementModal={showSettlementModal}
                  setShowSettlementModal={setShowSettlementModal}
                />
              } />
              <Route path="organizations" element={
                <OrganizationApprovalPage
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  projectCategoryFilter={projectCategoryFilter}
                  setProjectCategoryFilter={setProjectCategoryFilter}
                  projectSearchTerm={projectSearchTerm}
                  setProjectSearchTerm={setProjectSearchTerm}
                  userTypeFilter={userTypeFilter}
                  setUserTypeFilter={setUserTypeFilter}
                  userStatusFilter={userStatusFilter}
                  setUserStatusFilter={setUserStatusFilter}
                  userSearchTerm={userSearchTerm}
                  setUserSearchTerm={setUserSearchTerm}
                  settlementFilter={settlementFilter}
                  setSettlementFilter={setSettlementFilter}
                  settlementSearchTerm={settlementSearchTerm}
                  setSettlementSearchTerm={setSettlementSearchTerm}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                  selectedSettlements={selectedSettlements}
                  setSelectedSettlements={setSelectedSettlements}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedUser={selectedUser}
                  setSelectedUser={setSelectedUser}
                  selectedSettlement={selectedSettlement}
                  setSelectedSettlement={setSelectedSettlement}
                  showProjectModal={showProjectModal}
                  setShowProjectModal={setShowProjectModal}
                  showUserModal={showUserModal}
                  setShowUserModal={setShowUserModal}
                  showSettlementModal={showSettlementModal}
                  setShowSettlementModal={setShowSettlementModal}
                />
              } />
              <Route path="projects" element={
                <ProjectManagementPage
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  projectCategoryFilter={projectCategoryFilter}
                  setProjectCategoryFilter={setProjectCategoryFilter}
                  projectSearchTerm={projectSearchTerm}
                  setProjectSearchTerm={setProjectSearchTerm}
                  userTypeFilter={userTypeFilter}
                  setUserTypeFilter={setUserTypeFilter}
                  userStatusFilter={userStatusFilter}
                  setUserStatusFilter={setUserStatusFilter}
                  userSearchTerm={userSearchTerm}
                  setUserSearchTerm={setUserSearchTerm}
                  settlementFilter={settlementFilter}
                  setSettlementFilter={setSettlementFilter}
                  settlementSearchTerm={settlementSearchTerm}
                  setSettlementSearchTerm={setSettlementSearchTerm}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                  selectedSettlements={selectedSettlements}
                  setSelectedSettlements={setSelectedSettlements}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  selectedUser={selectedUser}
                  setSelectedUser={setSelectedUser}
                  selectedSettlement={selectedSettlement}
                  setSelectedSettlement={setSelectedSettlement}
                  showProjectModal={showProjectModal}
                  setShowProjectModal={setShowProjectModal}
                  showUserModal={showUserModal}
                  setShowUserModal={setShowUserModal}
                  showSettlementModal={showSettlementModal}
                  setShowSettlementModal={setShowSettlementModal}
                  rejectReason={rejectReason}
                  setRejectReason={setRejectReason}
                />
              } />
              <Route path="settlements" element={<SettlementManagementPage />} />
              <Route path="expenses" element={<ExpenseApprovalPage />} />
              <Route path="donations" element={<DonationManagementPage />} />
              <Route path="reports" element={<ReportManagementPage />} />
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Test Mail Page - 레이아웃 없음 */}
        <Route path="/test/mail" element={<TestMailPage />} />

        {/* Notification Page - 레이아웃 없음, API 사용 */}
        <Route path="/notifications" element={<NotificationPageWithAPI />} />

        {/* Payment Pages - 레이아웃 없음 */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/access" element={<PaymentSuccessPage />} /> {/* 카카오페이 테스트 환경 임시 경로 */}
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />

        {/* TossPay Payment Pages */}
        <Route path="/payment/toss/success" element={<TossPaySuccessPage />} />
        <Route path="/payment/toss/fail" element={<TossPayFailPage />} />

        {/* Main Routes - MainLayout으로 감싸기 */}
        <Route path="/*" element={
          <MainLayout
            isLoggedIn={isLoggedIn}
            userType={userType}
            userProfile={userProfile}
            handleLogout={handleLogout}
          >
            <Routes>
              <Route path="/" element={
                <HomePage
                  isLoggedIn={isLoggedIn}
                  userType={userType}
                />
              } />
              <Route path="/introduction" element={<IntroductionPage />} />
              <Route path="/organizations" element={
                <OrganizationListPage />
              } />
              <Route path="/organizations/:orgId/projects" element={
                <OrganizationProjectsPage
                  isLoggedIn={isLoggedIn}
                  onProjectSelect={(project) => setSelectedProject(project)}
                  onNavigateToLogin={() => {}}
                />
              } />
              <Route path="/projects" element={
                <ProjectListPage
                  isLoggedIn={isLoggedIn}
                  favoriteProjectIds={favoriteProjectIds}
                  onProjectSelect={(project) => setSelectedProject(project)}
                  onNavigateToLogin={() => {}}
                />
              } />
              <Route path="/projects/:id" element={
                <ProjectDetailContainerWrapper
                  isLoggedIn={isLoggedIn}
                  favoriteProjectIds={favoriteProjectIds}
                  onShowDonationModal={() => setShowDonationModal(true)}
                />
              } />
              <Route path="/projects/create" element={
                <ProtectedRoute>
                  <ProjectCreatePageWrapper />
                </ProtectedRoute>
              } />
              <Route path="/community" element={
                <BoardPage
                  isLoggedIn={isLoggedIn}
                  userType={userType}
                  communityPosts={communityPosts}
                  postViews={postViews}
                  uploadedImageFiles={uploadedImageFiles}
                  onNavigateToPostDetail={(post) => {
                    setSelectedPost(post);
                    incrementView(post.id);
                  }}
                  onNavigateToCreatePost={() => {}}
                  onImageUpload={handleImageUpload}
                  onRemoveImage={removeImage}
                  setUploadedImageFiles={setUploadedImageFiles}
                />
              } />
              <Route path="/community/:id" element={
                selectedPost ? (
                  <PostDetailPage
                    selectedPost={selectedPost}
                    isLoggedIn={isLoggedIn}
                    userType={userType}
                    currentUserName={userProfile.name}
                    postViews={postViews}
                    onNavigateToEdit={(post) => setSelectedPost(post)}
                    onNavigateToBoard={() => window.location.href = '/community'}
                    onDeletePost={(postId) => {
                      toast.success('게시글이 삭제되었습니다.');
                    }}
                    onIncrementView={incrementView}
                  />
                ) : <Navigate to="/community" replace />
              } />
              <Route path="/community/edit/:id" element={
                selectedPost ? (
                  <EditPostPage
                    selectedPost={selectedPost}
                    userType={userType}
                    uploadedImageFiles={uploadedImageFiles}
                    onNavigateToPostDetail={(post) => setSelectedPost(post)}
                    onUpdatePost={(postId, updatedData) => {
                      toast.success('게시글이 수정되었습니다.');
                      setSelectedPost({ ...selectedPost, ...updatedData });
                    }}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                    setUploadedImageFiles={setUploadedImageFiles}
                  />
                ) : <Navigate to="/community" replace />
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage
                    userType={userType}
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    donationHistory={donationHistory}
                    favoriteProjects={projects.filter(p => favoriteProjectIds.has(p.id))}
                    piggyBanks={piggyBanks}
                    favoriteProjectIds={favoriteProjectIds}
                    setFavoriteProjectIds={setFavoriteProjectIds}
                    setSelectedProject={setSelectedProject}
                  />
                </ProtectedRoute>
              } />
              <Route path="/organization/dashboard" element={
                <ProtectedRoute allowedUserTypes={['organization']}>
                  <OrganizationDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/organization/profile" element={
                <ProtectedRoute allowedUserTypes={['organization']}>
                  <OrganizationProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/organization/projects/:projectId/piggybank" element={
                <ProtectedRoute allowedUserTypes={['organization']}>
                  <PiggyBankManagementPage />
                </ProtectedRoute>
              } />
              <Route path="/organization/statistics" element={
                <ProtectedRoute allowedUserTypes={['organization']}>
                  <OrganizationProjectStatisticsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </MainLayout>
        } />
      </Routes>

      {/* Global Modals */}
      {showDonationModal && selectedProject && (
        <DonationModal
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          onClose={() => setShowDonationModal(false)}
        />
      )}
    </>
  );
};

// DonationPlatform 컴포넌트: BrowserRouter로 감싸기
const DonationPlatform: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,  // 4초 (기본값)
          style: {
            background: '#333',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,  // 에러는 5초
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
};

// QueryClientProvider로 감싸서 export
const App: React.FC = () => {
  // 토큰 초기화는 이제 모듈 최상단에서 동기적으로 실행됨 (line 712-716)

  return (
    <QueryClientProvider client={queryClient}>
      <DonationPlatform />
    </QueryClientProvider>
  );
};

export default App;
