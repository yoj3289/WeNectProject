// import React, { useState } from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// // Type imports
// import type { UserType, Project, CommunityPost, UserProfile, AdminUser, Notification, SettlementRequest, DonationHistory, PiggyBank } from './types';

// // Page imports
// import HomePage from './pages/HomePage';
// import LoginPage from './pages/auth/LoginPage';
// import SignupPage from './pages/auth/SignupPage';
// import ProjectListPage from './pages/project/ProjectListPage';
// import ProjectDetailPage from './pages/project/ProjectDetailPage';
// import ProjectCreatePage from './pages/project/ProjectCreatePage';
// import BoardPage from './pages/community/BoardPage';
// import PostDetailPage from './pages/community/PostDetailPage';
// import EditPostPage from './pages/community/EditPostPage';
// import ProfilePage from './pages/user/ProfilePage';
// import DashboardPage from './pages/admin/DashboardPage';
// import UserManagementPage from './pages/admin/UserManagementPage';
// import ProjectManagementPage from './pages/admin/ProjectManagementPage';
// import SettlementManagementPage from './pages/admin/SettlementManagementPage';
// import NotificationPage from './pages/notification/NotificationPage';

// // Component imports
// import DonationModal from './components/donation/DonationModal';

// // Layout imports
// import MainLayout from './layouts/MainLayout';
// import AuthLayout from './layouts/AuthLayout';
// import AdminLayout from './layouts/AdminLayout';

// // React Query 클라이언트 생성
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000, // 5분
//       gcTime: 10 * 60 * 1000, // 10분
//       retry: 1,
//       refetchOnWindowFocus: false,
//     },
//   },
// });

// const DonationPlatform: React.FC = () => {
//   // UI states
//   const [selectedProject, setSelectedProject] = useState<Project | null>(null);
//   const [showDonationModal, setShowDonationModal] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userType, setUserType] = useState<UserType>('individual');
//   const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

//   // Project & Donation states
//   const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<number>>(new Set([1, 2, 5]));

//   // Community states
//   const [uploadedImageFiles, setUploadedImageFiles] = useState<File[]>([]);
//   const [postViews, setPostViews] = useState<Map<number, number>>(new Map([[1, 234], [2, 89], [3, 156]]));
//   const [viewedPostIds, setViewedPostIds] = useState<Set<number>>(new Set());

//   // Admin states
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [activeMenu, setActiveMenu] = useState('dashboard');
//   const [projectFilter, setProjectFilter] = useState('all');
//   const [projectCategoryFilter, setProjectCategoryFilter] = useState('all');
//   const [projectSearchTerm, setProjectSearchTerm] = useState('');
//   const [userTypeFilter, setUserTypeFilter] = useState('all');
//   const [userStatusFilter, setUserStatusFilter] = useState('all');
//   const [userSearchTerm, setUserSearchTerm] = useState('');
//   const [settlementFilter, setSettlementFilter] = useState('all');
//   const [settlementSearchTerm, setSettlementSearchTerm] = useState('');
//   const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
//   const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
//   const [selectedSettlements, setSelectedSettlements] = useState<number[]>([]);
//   const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
//   const [selectedSettlement, setSelectedSettlement] = useState<SettlementRequest | null>(null);
//   const [showProjectModal, setShowProjectModal] = useState(false);
//   const [showUserModal, setShowUserModal] = useState(false);
//   const [showSettlementModal, setShowSettlementModal] = useState(false);
//   const [rejectReason, setRejectReason] = useState('');

//   // Mock data
//   const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
//     { id: 1, name: '김민수', email: 'user1@example.com', type: '일반', status: 'active', registeredDate: '2024-01-15', lastLogin: '2024-03-15 14:30' },
//     { id: 2, name: '희망나눔재단', email: 'hope@example.com', type: '기관', status: 'active', registeredDate: '2024-02-01', lastLogin: '2024-03-14 09:20' },
//     { id: 3, name: '이영희', email: 'user2@example.com', type: '일반', status: 'inactive', registeredDate: '2024-01-20', lastLogin: '2024-02-28 18:45' }
//   ]);

//   const [userProfile, setUserProfile] = useState<UserProfile>({
//     name: '김민수',
//     email: 'user@example.com',
//     phone: '010-1234-5678',
//     notificationSettings: { donation: true, project: true, comment: true, newsletter: false }
//   });

//   const [notifications, setNotifications] = useState<Notification[]>([
//     {
//       id: 1,
//       type: 'donation',
//       category: 'donation',
//       title: '기부가 완료되었습니다',
//       message: '"희망의 집 짓기" 프로젝트에 50,000원을 기부하셨습니다. 따뜻한 마음에 감사드립니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 5),
//       isRead: false,
//       isArchived: false,
//       link: '/donation-history',
//       metadata: { projectName: '희망의 집 짓기', amount: '50,000원' }
//     },
//     {
//       id: 2,
//       type: 'comment',
//       category: 'community',
//       title: '새로운 댓글이 있습니다',
//       message: '희망재단님이 "프로젝트 진행 상황 공유" 게시글에 댓글을 남겼습니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 30),
//       isRead: false,
//       isArchived: false,
//       link: '/community',
//       metadata: { author: '희망재단', postTitle: '프로젝트 진행 상황 공유' }
//     },
//     {
//       id: 3,
//       type: 'project_approval',
//       category: 'project',
//       title: '프로젝트가 승인되었습니다',
//       message: '"아이들의 미래" 프로젝트가 관리자 검토를 통과하여 승인되었습니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
//       isRead: false,
//       isArchived: false,
//       link: '/projects',
//       metadata: { projectName: '아이들의 미래', approver: '관리자' }
//     },
//     {
//       id: 4,
//       type: 'goal_achieved',
//       category: 'project',
//       title: '🎉 목표 금액 달성!',
//       message: '"희망의 집 짓기" 프로젝트가 목표 금액 5,000,000원을 달성했습니다. 총 243명이 참여해주셨습니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
//       isRead: true,
//       isArchived: false,
//       link: '/projects',
//       metadata: { projectName: '희망의 집 짓기', donors: 243, amount: '5,000,000원' }
//     },
//     {
//       id: 5,
//       type: 'deadline_soon',
//       category: 'project',
//       title: '프로젝트 마감 임박',
//       message: '"봄날의 따뜻함" 프로젝트가 3일 후 마감됩니다. 현재 목표의 87%를 달성했습니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
//       isRead: true,
//       isArchived: false,
//       link: '/projects',
//       metadata: { projectName: '봄날의 따뜻함', daysLeft: 3, progress: 87 }
//     },
//     {
//       id: 6,
//       type: 'settlement',
//       category: 'settlement',
//       title: '정산이 완료되었습니다',
//       message: '"희망의 집 짓기" 프로젝트의 기부금 4,850,000원이 등록하신 계좌로 송금되었습니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
//       isRead: true,
//       isArchived: false,
//       link: '/settlement',
//       metadata: { projectName: '희망의 집 짓기', amount: '4,850,000원' }
//     },
//     {
//       id: 7,
//       type: 'reply',
//       category: 'community',
//       title: '새로운 답글이 있습니다',
//       message: '김민수님이 회원님의 댓글에 답글을 남겼습니다.',
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
//       isRead: true,
//       isArchived: false,
//       link: '/community',
//       metadata: { author: '김민수' }
//     },
//     {
//       id: 8,
//       type: 'project_rejection',
//       category: 'project',
//       title: '프로젝트가 반려되었습니다',
//       message: '"겨울나기 프로젝트"가 반려되었습니다. 사유: 서류 미비',
//       timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
//       isRead: true,
//       isArchived: false,
//       link: '/projects',
//       metadata: { projectName: '겨울나기 프로젝트', reason: '서류 미비' }
//     }
//   ]);

//   const [notificationSettings, setNotificationSettings] = useState({
//     donation: { enabled: true, email: true, sms: false, push: true },
//     comment: { enabled: true, email: true, sms: false, push: true },
//     project: { enabled: true, email: true, sms: false, push: false },
//     settlement: { enabled: true, email: true, sms: true, push: true },
//     deadline: { enabled: true, email: false, sms: false, push: true }
//   });

//   const projects: Project[] = [
//     { id: 1, title: '소외계층 아동 급식 지원', category: '아동복지', currentAmount: 4200000, targetAmount: 5000000, dday: 15, donors: 142, image: '', description: '결식 아동들에게 영양가 있는 급식을 제공합니다.', organization: '아이사랑재단', status: 'approved' },
//     { id: 2, title: '유기동물 보호소 운영비', category: '동물보호', currentAmount: 3150000, targetAmount: 3000000, dday: 8, donors: 89, image: '', description: '유기동물들의 치료와 보호를 위한 운영비를 모금합니다.', organization: '동물사랑협회', status: 'approved' },
//     { id: 3, title: '독거노인 생활 지원', category: '노인복지', currentAmount: 9800000, targetAmount: 10000000, dday: 25, donors: 234, image: '', description: '홀로 지내시는 어르신들의 생활을 지원합니다.', organization: '실버케어센터', status: 'approved' },
//     { id: 4, title: '산불 피해 지역 복구', category: '환경보호', currentAmount: 6500000, targetAmount: 15000000, dday: 45, donors: 156, image: '', description: '산불로 피해를 입은 지역의 복구를 돕습니다.', organization: '환경보호협회', status: 'approved' },
//     { id: 5, title: '지역아동센터 운영 지원', category: '교육', currentAmount: 2800000, targetAmount: 5000000, dday: 30, donors: 78, image: '', description: '지역 아동센터의 안정적인 운영을 지원합니다.', organization: '교육나눔재단', status: 'approved' },
//     { id: 6, title: '장애인 재활 프로그램', category: '장애인복지', currentAmount: 1500000, targetAmount: 8000000, dday: 60, donors: 45, image: '', description: '장애인들의 자립을 위한 재활 프로그램을 진행합니다.', organization: '함께하는세상', status: 'approved' }
//   ];

//   const communityPosts: CommunityPost[] = [
//     { id: 1, type: 'NOTICE', title: '2024년 3월 정산 일정 안내', author: '관리자', date: '2024-03-15', views: 234 },
//     { id: 2, type: 'QUESTION', title: '기부금 영수증 발급은 어떻게 하나요?', author: '김민수', date: '2024-03-14', views: 89 },
//     { id: 3, type: 'SUPPORT', title: '소외계층 아동 급식 지원 프로젝트를 응원합니다!', author: '이영희', date: '2024-03-13', views: 156 }
//   ];

//   const donationHistory: DonationHistory[] = [
//     { id: 1, projectTitle: '소외계층 아동 급식 지원', amount: 50000, date: '2024-03-15', receiptNumber: 'R2024031501', status: 'completed' },
//     { id: 2, projectTitle: '유기동물 보호소 운영비', amount: 30000, date: '2024-03-10', receiptNumber: 'R2024031002', status: 'completed' },
//     { id: 3, projectTitle: '독거노인 생활 지원', amount: 100000, date: '2024-02-28', receiptNumber: 'R2024022803', status: 'completed' }
//   ];

//   const piggyBanks: PiggyBank[] = [
//     { projectId: 1, projectTitle: '독거노인 생활 지원', totalAmount: 9800000, withdrawnAmount: 0, balance: 9800000, status: 'active', lastUpdated: '2024-03-15' },
//     { projectId: 2, projectTitle: '지역아동센터 운영 지원', totalAmount: 5000000, withdrawnAmount: 5000000, balance: 0, status: 'withdrawn', lastUpdated: '2024-02-28' }
//   ];

//   // Utility functions
//   const formatAmount = (amount: number): string => {
//     return amount.toLocaleString('ko-KR');
//   };

//   const toggleFavoriteProject = (projectId: number) => {
//     const newFavorites = new Set(favoriteProjectIds);
//     if (newFavorites.has(projectId)) {
//       newFavorites.delete(projectId);
//       alert('관심 프로젝트에서 제거되었습니다.');
//     } else {
//       newFavorites.add(projectId);
//       alert('관심 프로젝트에 추가되었습니다.');
//     }
//     setFavoriteProjectIds(newFavorites);
//   };

//   const incrementView = (postId: number) => {
//     if (viewedPostIds.has(postId)) return;
//     const newViews = new Map(postViews);
//     const currentViews = newViews.get(postId) || 0;
//     newViews.set(postId, currentViews + 1);
//     setPostViews(newViews);
//     const newViewedIds = new Set(viewedPostIds);
//     newViewedIds.add(postId);
//     setViewedPostIds(newViewedIds);
//   };

//   const handleLogout = () => {
//     setIsLoggedIn(false);
//     setUserType('individual');
//     alert('로그아웃되었습니다.');
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files || []);
//     if (uploadedImageFiles.length + files.length > 5) {
//       alert('이미지는 최대 5개까지 업로드 가능합니다.');
//       return;
//     }
//     const maxSize = 5 * 1024 * 1024;
//     const validFiles = files.filter(file => {
//       if (file.size > maxSize) {
//         alert(`${file.name}은(는) 5MB를 초과합니다.`);
//         return false;
//       }
//       return true;
//     });
//     setUploadedImageFiles([...uploadedImageFiles, ...validFiles]);
//   };

//   const removeImage = (index: number) => {
//     setUploadedImageFiles(uploadedImageFiles.filter((_, i) => i !== index));
//   };

//   // Notification handlers
//   const handleMarkAsRead = (id: number) => {
//     setNotifications(notifications.map(n =>
//       n.id === id ? { ...n, isRead: true } : n
//     ));
//   };

//   const handleMarkAllAsRead = () => {
//     setNotifications(notifications.map(n => ({ ...n, isRead: true })));
//   };

//   const handleDeleteNotification = (id: number) => {
//     setNotifications(notifications.filter(n => n.id !== id));
//   };

//   const handleArchiveNotification = (id: number) => {
//     setNotifications(notifications.map(n =>
//       n.id === id ? { ...n, isArchived: !n.isArchived } : n
//     ));
//   };

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Auth Routes - AuthLayout 내부에서 처리 */}
//         <Route path="/login" element={
//           <AuthLayout>
//             <LoginPage />
//           </AuthLayout>
//         } />
//         <Route path="/signup" element={
//           <AuthLayout>
//             <SignupPage />
//           </AuthLayout>
//         } />

//         {/* Admin Routes - AdminLayout으로 감싸기 */}
//         <Route path="/admin/*" element={
//           <AdminLayout
//             activeMenu={activeMenu}
//             setActiveMenu={setActiveMenu}
//           >
//             <Routes>
//               <Route path="dashboard" element={
//                 <DashboardPage
//                   sidebarOpen={sidebarOpen}
//                   setSidebarOpen={setSidebarOpen}
//                   activeMenu={activeMenu}
//                   setActiveMenu={setActiveMenu}
//                   projectFilter={projectFilter}
//                   setProjectFilter={setProjectFilter}
//                   projectCategoryFilter={projectCategoryFilter}
//                   setProjectCategoryFilter={setProjectCategoryFilter}
//                   projectSearchTerm={projectSearchTerm}
//                   setProjectSearchTerm={setProjectSearchTerm}
//                   userTypeFilter={userTypeFilter}
//                   setUserTypeFilter={setUserTypeFilter}
//                   userStatusFilter={userStatusFilter}
//                   setUserStatusFilter={setUserStatusFilter}
//                   userSearchTerm={userSearchTerm}
//                   setUserSearchTerm={setUserSearchTerm}
//                   settlementFilter={settlementFilter}
//                   setSettlementFilter={setSettlementFilter}
//                   settlementSearchTerm={settlementSearchTerm}
//                   setSettlementSearchTerm={setSettlementSearchTerm}
//                   selectedProjects={selectedProjects}
//                   setSelectedProjects={setSelectedProjects}
//                   selectedUsers={selectedUsers}
//                   setSelectedUsers={setSelectedUsers}
//                   selectedSettlements={selectedSettlements}
//                   setSelectedSettlements={setSelectedSettlements}
//                   selectedProject={selectedProject}
//                   setSelectedProject={setSelectedProject}
//                   selectedUser={selectedUser}
//                   setSelectedUser={setSelectedUser}
//                   selectedSettlement={selectedSettlement}
//                   setSelectedSettlement={setSelectedSettlement}
//                   showProjectModal={showProjectModal}
//                   setShowProjectModal={setShowProjectModal}
//                   showUserModal={showUserModal}
//                   setShowUserModal={setShowUserModal}
//                   showSettlementModal={showSettlementModal}
//                   setShowSettlementModal={setShowSettlementModal}
//                   rejectReason={rejectReason}
//                   setRejectReason={setRejectReason}
//                   adminUsers={adminUsers}
//                 />
//               } />
//               <Route path="users" element={
//                 <UserManagementPage
//                   sidebarOpen={sidebarOpen}
//                   setSidebarOpen={setSidebarOpen}
//                   activeMenu={activeMenu}
//                   setActiveMenu={setActiveMenu}
//                   projectFilter={projectFilter}
//                   setProjectFilter={setProjectFilter}
//                   projectCategoryFilter={projectCategoryFilter}
//                   setProjectCategoryFilter={setProjectCategoryFilter}
//                   projectSearchTerm={projectSearchTerm}
//                   setProjectSearchTerm={setProjectSearchTerm}
//                   userTypeFilter={userTypeFilter}
//                   setUserTypeFilter={setUserTypeFilter}
//                   userStatusFilter={userStatusFilter}
//                   setUserStatusFilter={setUserStatusFilter}
//                   userSearchTerm={userSearchTerm}
//                   setUserSearchTerm={setUserSearchTerm}
//                   settlementFilter={settlementFilter}
//                   setSettlementFilter={setSettlementFilter}
//                   settlementSearchTerm={settlementSearchTerm}
//                   setSettlementSearchTerm={setSettlementSearchTerm}
//                   selectedProjects={selectedProjects}
//                   setSelectedProjects={setSelectedProjects}
//                   selectedUsers={selectedUsers}
//                   setSelectedUsers={setSelectedUsers}
//                   selectedSettlements={selectedSettlements}
//                   setSelectedSettlements={setSelectedSettlements}
//                   selectedProject={selectedProject}
//                   setSelectedProject={setSelectedProject}
//                   selectedUser={selectedUser}
//                   setSelectedUser={setSelectedUser}
//                   selectedSettlement={selectedSettlement}
//                   setSelectedSettlement={setSelectedSettlement}
//                   showProjectModal={showProjectModal}
//                   setShowProjectModal={setShowProjectModal}
//                   showUserModal={showUserModal}
//                   setShowUserModal={setShowUserModal}
//                   showSettlementModal={showSettlementModal}
//                   setShowSettlementModal={setShowSettlementModal}
//                 />
//               } />
//               <Route path="projects" element={
//                 <ProjectManagementPage
//                   sidebarOpen={sidebarOpen}
//                   setSidebarOpen={setSidebarOpen}
//                   activeMenu={activeMenu}
//                   setActiveMenu={setActiveMenu}
//                   projectFilter={projectFilter}
//                   setProjectFilter={setProjectFilter}
//                   projectCategoryFilter={projectCategoryFilter}
//                   setProjectCategoryFilter={setProjectCategoryFilter}
//                   projectSearchTerm={projectSearchTerm}
//                   setProjectSearchTerm={setProjectSearchTerm}
//                   userTypeFilter={userTypeFilter}
//                   setUserTypeFilter={setUserTypeFilter}
//                   userStatusFilter={userStatusFilter}
//                   setUserStatusFilter={setUserStatusFilter}
//                   userSearchTerm={userSearchTerm}
//                   setUserSearchTerm={setUserSearchTerm}
//                   settlementFilter={settlementFilter}
//                   setSettlementFilter={setSettlementFilter}
//                   settlementSearchTerm={settlementSearchTerm}
//                   setSettlementSearchTerm={setSettlementSearchTerm}
//                   selectedProjects={selectedProjects}
//                   setSelectedProjects={setSelectedProjects}
//                   selectedUsers={selectedUsers}
//                   setSelectedUsers={setSelectedUsers}
//                   selectedSettlements={selectedSettlements}
//                   setSelectedSettlements={setSelectedSettlements}
//                   selectedProject={selectedProject}
//                   setSelectedProject={setSelectedProject}
//                   selectedUser={selectedUser}
//                   setSelectedUser={setSelectedUser}
//                   selectedSettlement={selectedSettlement}
//                   setSelectedSettlement={setSelectedSettlement}
//                   showProjectModal={showProjectModal}
//                   setShowProjectModal={setShowProjectModal}
//                   showUserModal={showUserModal}
//                   setShowUserModal={setShowUserModal}
//                   showSettlementModal={showSettlementModal}
//                   setShowSettlementModal={setShowSettlementModal}
//                   rejectReason={rejectReason}
//                   setRejectReason={setRejectReason}
//                 />
//               } />
//               <Route path="settlements" element={
//                 <SettlementManagementPage
//                   sidebarOpen={sidebarOpen}
//                   setSidebarOpen={setSidebarOpen}
//                   activeMenu={activeMenu}
//                   setActiveMenu={setActiveMenu}
//                   projectFilter={projectFilter}
//                   setProjectFilter={setProjectFilter}
//                   projectCategoryFilter={projectCategoryFilter}
//                   setProjectCategoryFilter={setProjectCategoryFilter}
//                   projectSearchTerm={projectSearchTerm}
//                   setProjectSearchTerm={setProjectSearchTerm}
//                   userTypeFilter={userTypeFilter}
//                   setUserTypeFilter={setUserTypeFilter}
//                   userStatusFilter={userStatusFilter}
//                   setUserStatusFilter={setUserStatusFilter}
//                   userSearchTerm={userSearchTerm}
//                   setUserSearchTerm={setUserSearchTerm}
//                   settlementFilter={settlementFilter}
//                   setSettlementFilter={setSettlementFilter}
//                   settlementSearchTerm={settlementSearchTerm}
//                   setSettlementSearchTerm={setSettlementSearchTerm}
//                   selectedProjects={selectedProjects}
//                   setSelectedProjects={setSelectedProjects}
//                   selectedUsers={selectedUsers}
//                   setSelectedUsers={setSelectedUsers}
//                   selectedSettlements={selectedSettlements}
//                   setSelectedSettlements={setSelectedSettlements}
//                   selectedProject={selectedProject}
//                   setSelectedProject={setSelectedProject}
//                   selectedUser={selectedUser}
//                   setSelectedUser={setSelectedUser}
//                   selectedSettlement={selectedSettlement}
//                   setSelectedSettlement={setSelectedSettlement}
//                   showProjectModal={showProjectModal}
//                   setShowProjectModal={setShowProjectModal}
//                   showUserModal={showUserModal}
//                   setShowUserModal={setShowUserModal}
//                   showSettlementModal={showSettlementModal}
//                   setShowSettlementModal={setShowSettlementModal}
//                   rejectReason={rejectReason}
//                   setRejectReason={setRejectReason}
//                 />
//               } />
//               <Route index element={<Navigate to="/admin/dashboard" replace />} />
//             </Routes>
//           </AdminLayout>
//         } />

//         {/* Notification Page - 레이아웃 없음 */}
//         <Route path="/notifications" element={
//           <NotificationPage
//             notifications={notifications}
//             onMarkAsRead={handleMarkAsRead}
//             onMarkAllAsRead={handleMarkAllAsRead}
//             onDelete={handleDeleteNotification}
//             onArchive={handleArchiveNotification}
//             notificationSettings={notificationSettings}
//             onUpdateSettings={(settings) => setNotificationSettings(settings as typeof notificationSettings)}
//             onShowConsentModal={() => alert('수신 동의 관리 모달을 표시합니다.')}
//             onShowHistoryModal={() => alert('발송 내역 모달을 표시합니다.')}
//           />
//         } />

//         {/* Main Routes - MainLayout으로 감싸기 */}
//         <Route path="/*" element={
//           <MainLayout
//             isLoggedIn={isLoggedIn}
//             userType={userType}
//             notifications={notifications}
//             userProfile={userProfile}
//             handleLogout={handleLogout}
//             onMarkAsRead={handleMarkAsRead}
//             onMarkAllAsRead={handleMarkAllAsRead}
//             onDeleteNotification={handleDeleteNotification}
//             notificationSettings={notificationSettings}
//             onUpdateNotificationSettings={(settings) => setNotificationSettings(settings as typeof notificationSettings)}
//           >
//             <Routes>
//               <Route path="/" element={
//                 <HomePage
//                   isLoggedIn={isLoggedIn}
//                   userType={userType}
//                 />
//               } />
//               <Route path="/projects" element={
//                 <ProjectListPage
//                   isLoggedIn={isLoggedIn}
//                   favoriteProjectIds={favoriteProjectIds}
//                   onProjectSelect={(project) => setSelectedProject(project)}
//                   onNavigateToLogin={() => {}}
//                 />
//               } />
//               <Route path="/projects/:id" element={
//                 <ProjectDetailPage
//                   projectId={selectedProject?.id || 0}
//                   isLoggedIn={isLoggedIn}
//                   favoriteProjectIds={favoriteProjectIds}
//                   onNavigateToLogin={() => {}}
//                   onShowDonationModal={() => setShowDonationModal(true)}
//                 />
//               } />
//               <Route path="/projects/create" element={
//                 <ProjectCreatePage
//                   onSubmit={() => {
//                     alert('프로젝트 신청이 완료되었습니다. 관리자 승인 후 게시됩니다.');
//                   }}
//                 />
//               } />
//               <Route path="/community" element={
//                 <BoardPage
//                   isLoggedIn={isLoggedIn}
//                   userType={userType}
//                   communityPosts={communityPosts}
//                   postViews={postViews}
//                   uploadedImageFiles={uploadedImageFiles}
//                   onNavigateToPostDetail={(post) => {
//                     setSelectedPost(post);
//                     incrementView(post.id);
//                   }}
//                   onNavigateToCreatePost={() => {}}
//                   onImageUpload={handleImageUpload}
//                   onRemoveImage={removeImage}
//                   setUploadedImageFiles={setUploadedImageFiles}
//                 />
//               } />
//               <Route path="/community/:id" element={
//                 selectedPost ? (
//                   <PostDetailPage
//                     selectedPost={selectedPost}
//                     isLoggedIn={isLoggedIn}
//                     userType={userType}
//                     currentUserName={userProfile.name}
//                     postViews={postViews}
//                     onNavigateToEdit={(post) => setSelectedPost(post)}
//                     onNavigateToBoard={() => window.location.href = '/community'}
//                     onDeletePost={(postId) => {
//                       alert('게시글이 삭제되었습니다.');
//                     }}
//                     onIncrementView={incrementView}
//                   />
//                 ) : <Navigate to="/community" replace />
//               } />
//               <Route path="/community/edit/:id" element={
//                 selectedPost ? (
//                   <EditPostPage
//                     selectedPost={selectedPost}
//                     userType={userType}
//                     uploadedImageFiles={uploadedImageFiles}
//                     onNavigateToPostDetail={(post) => setSelectedPost(post)}
//                     onUpdatePost={(postId, updatedData) => {
//                       alert('게시글이 수정되었습니다.');
//                       setSelectedPost({ ...selectedPost, ...updatedData });
//                     }}
//                     onImageUpload={handleImageUpload}
//                     onRemoveImage={removeImage}
//                     setUploadedImageFiles={setUploadedImageFiles}
//                   />
//                 ) : <Navigate to="/community" replace />
//               } />
//               <Route path="/profile" element={
//                 <ProfilePage
//                   userType={userType}
//                   userProfile={userProfile}
//                   setUserProfile={setUserProfile}
//                   donationHistory={donationHistory}
//                   favoriteProjects={projects.filter(p => favoriteProjectIds.has(p.id))}
//                   piggyBanks={piggyBanks}
//                   favoriteProjectIds={favoriteProjectIds}
//                   setFavoriteProjectIds={setFavoriteProjectIds}
//                   setSelectedProject={setSelectedProject}
//                 />
//               } />
//             </Routes>
//           </MainLayout>
//         } />
//       </Routes>

//       {/* Global Modals */}
//       <DonationModal
//         selectedProject={selectedProject}
//         showDonationModal={showDonationModal}
//         setShowDonationModal={setShowDonationModal}
//         formatAmount={formatAmount}
//       />
//     </BrowserRouter>
//   );
// };

// // QueryClientProvider로 감싸서 export
// const App: React.FC = () => {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <DonationPlatform />
//     </QueryClientProvider>
//   );
// };

// export default App;


import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ✅ useAuth import 추가!
import { useAuth } from './hooks/useAuth';

// Type imports
import type { UserType, Project, CommunityPost, UserProfile, AdminUser, Notification, SettlementRequest, DonationHistory, PiggyBank } from './types';

// Page imports
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ProjectListPage from './pages/project/ProjectListPage';
import ProjectDetailPage from './pages/project/ProjectDetailPage';
import ProjectCreatePage from './pages/project/ProjectCreatePage';
import { useParams } from 'react-router-dom';
import BoardPage from './pages/community/BoardPage';
import PostDetailPage from './pages/community/PostDetailPage';
import EditPostPage from './pages/community/EditPostPage';
import ProfilePage from './pages/user/ProfilePage';
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ProjectManagementPage from './pages/admin/ProjectManagementPage';
import SettlementManagementPage from './pages/admin/SettlementManagementPage';
import OrganizationApprovalPage from './pages/admin/OrganizationApprovalPage';
import NotificationPage from './pages/notification/NotificationPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import PaymentCancelPage from './pages/payment/PaymentCancelPage';
import PaymentFailPage from './pages/payment/PaymentFailPage';

// Component imports
import DonationModal from './components/donation/DonationModal';

// Layout imports
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

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

const DonationPlatform: React.FC = () => {
  // ✅ useAuth로 실제 로그인 상태 가져오기
  const { isLoggedIn, user, logout } = useAuth();

  // userType은 user 객체에서 가져오기 (기본값은 'individual')
  const userType: UserType = user?.userType || 'individual';

  // UI states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

  // URL 파라미터에서 ID를 추출하는 Wrapper 컴포넌트
  const ProjectDetailPageWrapper: React.FC<{
    isLoggedIn: boolean;
    favoriteProjectIds: Set<number>;
    onShowDonationModal: () => void;
  }> = ({ isLoggedIn, favoriteProjectIds, onShowDonationModal }) => {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);

    return (
      <ProjectDetailPage
        projectId={projectId}
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
  const [postViews, setPostViews] = useState<Map<number, number>>(new Map([[1, 234], [2, 89], [3, 156]]));
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
    { id: 1, title: '소외계층 아동 급식 지원', category: '아동복지', currentAmount: 4200000, targetAmount: 5000000, dday: 15, donors: 142, image: '', description: '결식 아동들에게 영양가 있는 급식을 제공합니다.', organization: '아이사랑재단', status: 'approved' },
    { id: 2, title: '유기동물 보호소 운영비', category: '동물보호', currentAmount: 3150000, targetAmount: 3000000, dday: 8, donors: 89, image: '', description: '유기동물들의 치료와 보호를 위한 운영비를 모금합니다.', organization: '동물사랑협회', status: 'approved' },
    { id: 3, title: '독거노인 생활 지원', category: '노인복지', currentAmount: 9800000, targetAmount: 10000000, dday: 25, donors: 234, image: '', description: '홀로 지내시는 어르신들의 생활을 지원합니다.', organization: '실버케어센터', status: 'approved' },
    { id: 4, title: '산불 피해 지역 복구', category: '환경보호', currentAmount: 6500000, targetAmount: 15000000, dday: 45, donors: 156, image: '', description: '산불로 피해를 입은 지역의 복구를 돕습니다.', organization: '환경보호협회', status: 'approved' },
    { id: 5, title: '지역아동센터 운영 지원', category: '교육', currentAmount: 2800000, targetAmount: 5000000, dday: 30, donors: 78, image: '', description: '지역 아동센터의 안정적인 운영을 지원합니다.', organization: '교육나눔재단', status: 'approved' },
    { id: 6, title: '장애인 재활 프로그램', category: '장애인복지', currentAmount: 1500000, targetAmount: 8000000, dday: 60, donors: 45, image: '', description: '장애인들의 자립을 위한 재활 프로그램을 진행합니다.', organization: '함께하는세상', status: 'approved' }
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
      alert('관심 프로젝트에서 제거되었습니다.');
    } else {
      newFavorites.add(projectId);
      alert('관심 프로젝트에 추가되었습니다.');
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
    alert('로그아웃되었습니다.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImageFiles.length + files.length > 5) {
      alert('이미지는 최대 5개까지 업로드 가능합니다.');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name}은(는) 5MB를 초과합니다.`);
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
    <BrowserRouter>
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

        {/* Admin Routes - AdminLayout으로 감싸기 */}
        <Route path="/admin/*" element={
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
              <Route path="settlements" element={
                <SettlementManagementPage
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
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </AdminLayout>
        } />

        {/* Notification Page - 레이아웃 없음 */}
        <Route path="/notifications" element={
          <NotificationPage
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDeleteNotification}
            onArchive={handleArchiveNotification}
            notificationSettings={notificationSettings}
            onUpdateSettings={(settings) => setNotificationSettings(settings as typeof notificationSettings)}
            onShowConsentModal={() => alert('수신 동의 관리 모달을 표시합니다.')}
            onShowHistoryModal={() => alert('발송 내역 모달을 표시합니다.')}
          />
        } />

        {/* Payment Pages - 레이아웃 없음 */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/access" element={<PaymentSuccessPage />} /> {/* 카카오페이 테스트 환경 임시 경로 */}
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/payment/fail" element={<PaymentFailPage />} />

        {/* Main Routes - MainLayout으로 감싸기 */}
        <Route path="/*" element={
          <MainLayout
            isLoggedIn={isLoggedIn}
            userType={userType}
            notifications={notifications}
            userProfile={userProfile}
            handleLogout={handleLogout}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
            notificationSettings={notificationSettings}
            onUpdateNotificationSettings={(settings) => setNotificationSettings(settings as typeof notificationSettings)}
          >
            <Routes>
              <Route path="/" element={
                <HomePage
                  isLoggedIn={isLoggedIn}
                  userType={userType}
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
                <ProjectDetailPageWrapper
                  isLoggedIn={isLoggedIn}
                  favoriteProjectIds={favoriteProjectIds}
                  onShowDonationModal={() => setShowDonationModal(true)}
                />
              } />
              <Route path="/projects/create" element={<ProjectCreatePageWrapper />} />
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
                      alert('게시글이 삭제되었습니다.');
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
                      alert('게시글이 수정되었습니다.');
                      setSelectedPost({ ...selectedPost, ...updatedData });
                    }}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={removeImage}
                    setUploadedImageFiles={setUploadedImageFiles}
                  />
                ) : <Navigate to="/community" replace />
              } />
              <Route path="/profile" element={
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
    </BrowserRouter>
  );
};

// QueryClientProvider로 감싸서 export
const App: React.FC = () => {
  // 앱 시작 시 Zustand에서 토큰을 가져와 apiClient에 설정
  React.useEffect(() => {
    const initAuth = async () => {
      // Zustand persist에서 복원된 토큰 가져오기
      const { useAuthStore } = await import('./stores/authStore');
      const { apiClient } = await import('./lib/apiClient');
      const token = useAuthStore.getState().token;

      if (token) {
        apiClient.setToken(token);
      }
    };

    initAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DonationPlatform />
    </QueryClientProvider>
  );
};

export default App;
