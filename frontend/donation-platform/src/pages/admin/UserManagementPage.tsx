import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, X, Heart, FileText, Clock, Settings, Shield, LogOut, History, User, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminDashboardProps } from '../../types/admin';
import { useAdminUsers } from '../../hooks/useAdmin';
import type { AdminUserResponse } from '../../api/admin';
import ConfirmModal from '../../components/common/ConfirmModal';

interface UserManagementPageProps extends AdminDashboardProps {}

type UserRole = 'user' | 'organization_admin' | 'super_admin';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  registeredDate: string;
  lastLogin: string;
  totalDonations: number;
  donationCount: number;
  projects: number;
}

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

interface RoleChangeHistory {
  id: number;
  userId: number;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  reason: string;
  timestamp: string;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({
  userTypeFilter,
  setUserTypeFilter,
  userStatusFilter,
  setUserStatusFilter,
  userSearchTerm,
  setUserSearchTerm,
  selectedUsers,
  setSelectedUsers,
  selectedUser,
  setSelectedUser,
  showUserModal,
  setShowUserModal,
}) => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showRoleHistory, setShowRoleHistory] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // 필터 변경 시 페이지를 0으로 리셋
  React.useEffect(() => {
    setCurrentPage(0);
  }, [userTypeFilter, userStatusFilter, userSearchTerm]);

  // ConfirmModal 상태
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // API 호출
  const { data, isLoading, error } = useAdminUsers({
    search: userSearchTerm || undefined,
    userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
    status: userStatusFilter !== 'all' ? userStatusFilter.toUpperCase() : undefined,
    page: currentPage,
    size: 20,
  });

  // 백엔드 데이터를 프론트엔드 형식으로 변환
  const users: User[] = data?.content?.map((apiUser: AdminUserResponse) => {
    const userTypeStr = apiUser.userType.toUpperCase();
    let role: UserRole = 'user';

    if (userTypeStr === 'INDIVIDUAL') {
      role = 'user';
    } else if (userTypeStr === 'ORGANIZATION') {
      role = 'organization_admin';
    } else if (userTypeStr === 'ADMIN') {
      role = 'super_admin';
    }

    return {
      id: apiUser.userId,
      name: apiUser.userName,
      email: apiUser.email,
      role: role,
      status: apiUser.status.toLowerCase() as 'active' | 'inactive' | 'suspended',
      registeredDate: new Date(apiUser.createdAt).toLocaleDateString('ko-KR'),
      lastLogin: apiUser.updatedAt ? new Date(apiUser.updatedAt).toLocaleString('ko-KR') : '-',
      totalDonations: 0, // TODO: 추후 기부 통계 API 연동
      donationCount: 0,
      projects: 0,
    };
  }) || [];

  // 페이지네이션 정보
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;
  const pageSize = 20;
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  const activityLogs: ActivityLog[] = [
    { id: 1, userId: 1, action: '로그인', details: '정상 로그인', timestamp: '2024-03-16 14:30', ipAddress: '192.168.1.100' },
    { id: 2, userId: 1, action: '기부 완료', details: '소외계층 아동 급식 지원 - 100,000원', timestamp: '2024-03-15 14:35', ipAddress: '192.168.1.100' },
    { id: 3, userId: 1, action: '댓글 작성', details: '유기동물 보호소 운영비 프로젝트', timestamp: '2024-03-14 16:20', ipAddress: '192.168.1.100' },
    { id: 4, userId: 1, action: '프로젝트 관심등록', details: '독거노인 생활 지원', timestamp: '2024-03-13 09:15', ipAddress: '192.168.1.100' },
    { id: 5, userId: 2, action: '로그인', details: '정상 로그인', timestamp: '2024-03-15 09:20', ipAddress: '192.168.1.105' },
    { id: 6, userId: 2, action: '기부 완료', details: '청소년 진로 멘토링 - 50,000원', timestamp: '2024-03-14 10:15', ipAddress: '192.168.1.105' },
    { id: 7, userId: 3, action: '프로젝트 승인', details: '장애인 재활 프로그램 승인', timestamp: '2024-03-16 16:45', ipAddress: '192.168.1.200' },
    { id: 8, userId: 3, action: '로그인', details: '정상 로그인', timestamp: '2024-03-16 16:40', ipAddress: '192.168.1.200' },
  ];

  const roleHistory: RoleChangeHistory[] = [
    { id: 1, userId: 3, previousRole: 'user', newRole: 'organization_admin', changedBy: '최관리', reason: '기관 관리자 권한 부여', timestamp: '2024-02-15 10:30' },
    { id: 2, userId: 4, previousRole: 'organization_admin', newRole: 'super_admin', changedBy: '시스템', reason: '최고 관리자 승격', timestamp: '2024-01-01 00:00' },
  ];

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'user': return '일반';
      case 'organization_admin': return '기관관리자';
      case 'super_admin': return '최고관리자';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'user': return 'bg-blue-100 text-blue-700';
      case 'organization_admin': return 'bg-purple-100 text-purple-700';
      case 'super_admin': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'suspended': return '정지';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleChangeUserStatus = React.useCallback((status: string) => {
    setConfirmModal({
      isOpen: true,
      title: '사용자 상태 변경',
      message: `사용자 상태를 "${getStatusLabel(status)}"로 변경하시겠습니까?`,
      onConfirm: () => {
        toast.success('사용자 상태가 변경되었습니다.');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const handleChangeRole = () => {
    if (!roleChangeReason.trim()) {
      toast.error('권한 변경 사유를 입력해주세요.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: '사용자 권한 변경',
      message: `사용자 권한을 "${getRoleLabel(selectedRole)}"로 변경하시겠습니까?`,
      onConfirm: () => {
        toast.success('사용자 권한이 변경되었습니다.');
        setShowRoleModal(false);
        setRoleChangeReason('');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleForceLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: '강제 로그아웃',
      message: '이 사용자를 강제 로그아웃 하시겠습니까?',
      isDanger: true,
      onConfirm: () => {
        toast.success('사용자가 강제 로그아웃되었습니다.');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 백엔드에서 이미 필터링되어 오므로 별도 필터링 불필요
  const filteredUsers = users;

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-800 mb-2">데이터 로딩 오류</h3>
          <p className="text-red-600">사용자 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">권한 변경</h2>
              <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">사용자: <strong>{(selectedUser as User).name}</strong> ({(selectedUser as User).email})</p>
                <p className="text-sm text-gray-600 mb-4">현재 권한: <strong>{getRoleLabel((selectedUser as User).role)}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">새로운 권한</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="user">일반</option>
                  <option value="organization_admin">기관관리자</option>
                  <option value="super_admin">최고관리자</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">변경 사유</label>
                <textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  placeholder="권한 변경 사유를 입력하세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleChangeRole}
                  className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600"
                >
                  권한 변경
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">활동 로그</h2>
              <button onClick={() => setShowActivityLog(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {activityLogs.filter(log => log.userId === (selectedUser as User).id).length > 0 ? (
                  activityLogs.filter(log => log.userId === (selectedUser as User).id).map((log) => (
                    <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{log.action}</p>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                          <p className="text-xs text-gray-500 mt-2">IP: {log.ipAddress}</p>
                        </div>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">활동 로그가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role History Modal */}
      {showRoleHistory && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">권한 변경 이력</h2>
              <button onClick={() => setShowRoleHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {roleHistory.filter(history => history.userId === (selectedUser as User).id).map((history) => (
                  <div key={history.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {getRoleLabel(history.previousRole)} → {getRoleLabel(history.newRole)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">사유: {history.reason}</p>
                        <p className="text-xs text-gray-500 mt-2">변경자: {history.changedBy}</p>
                      </div>
                      <span className="text-xs text-gray-500">{history.timestamp}</span>
                    </div>
                  </div>
                ))}
                {roleHistory.filter(history => history.userId === (selectedUser as User).id).length === 0 && (
                  <p className="text-center text-gray-500 py-8">권한 변경 이력이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">사용자 상세</h2>
                    <p className="text-sm text-stone-400">사용자 정보를 확인하세요</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 사용자 정보 카드 */}
            <div className="bg-amber-500 px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-amber-100 text-sm">회원 정보</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor((selectedUser as User).role)}`}>
                    {getRoleLabel((selectedUser as User).role)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor((selectedUser as User).status)}`}>
                    {getStatusLabel((selectedUser as User).status)}
                  </span>
                </div>
              </div>
              <h3 className="text-white font-medium text-lg mb-4">
                {(selectedUser as User).name}
              </h3>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-white" />
                    <span className="text-white/90 text-sm">이메일</span>
                  </div>
                  <span className="text-white font-medium text-sm">{(selectedUser as User).email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-white" />
                    <span className="text-white/90 text-sm">가입일</span>
                  </div>
                  <span className="text-white font-medium">{(selectedUser as User).registeredDate}</span>
                </div>
              </div>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* STEP 1: 활동 통계 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="font-medium text-stone-800">활동 통계</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-stone-600 mb-1">총 기부 금액</p>
                    <p className="text-lg font-bold text-amber-600">{(selectedUser as User).totalDonations.toLocaleString()}원</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-stone-600 mb-1">기부 횟수</p>
                    <p className="text-lg font-bold text-stone-600">{(selectedUser as User).donationCount}회</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-stone-600 mb-1">참여 프로젝트</p>
                    <p className="text-lg font-bold text-blue-600">{(selectedUser as User).projects}개</p>
                  </div>
                </div>
              </div>

              {/* STEP 2: 권한 및 활동 관리 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="font-medium text-stone-800">권한 및 활동 관리</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedRole((selectedUser as User).role);
                      setShowRoleModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition text-sm"
                  >
                    <Shield size={16} />
                    권한 변경
                  </button>
                  <button
                    onClick={() => setShowActivityLog(true)}
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition text-sm"
                  >
                    <Clock size={16} />
                    활동 로그
                  </button>
                  <button
                    onClick={() => setShowRoleHistory(true)}
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition text-sm"
                  >
                    <History size={16} />
                    권한 이력
                  </button>
                </div>
              </div>

              {/* STEP 3: 관리 액션 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <h4 className="font-medium text-stone-800">관리 액션</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleChangeUserStatus('active')}
                    className="px-3 py-3 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition text-sm"
                  >
                    활성화
                  </button>
                  <button
                    onClick={() => handleChangeUserStatus('inactive')}
                    className="px-3 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition text-sm"
                  >
                    비활성화
                  </button>
                  <button
                    onClick={() => handleChangeUserStatus('suspended')}
                    className="px-3 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition text-sm"
                  >
                    정지
                  </button>
                  <button
                    onClick={handleForceLogout}
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-orange-50 text-orange-700 rounded-xl font-medium hover:bg-orange-100 transition text-sm"
                  >
                    <LogOut size={16} />
                    강제 로그아웃
                  </button>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="border-t border-stone-200 p-4 bg-white">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="w-full px-4 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">사용자 관리</h1>
          <p className="text-sm text-gray-600 mt-1">회원 정보 및 권한을 관리합니다</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-200">
            {/* 검색창 */}
            <div className="relative mb-3 md:mb-0 md:flex md:items-center md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="이름, 이메일로 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* 필터 - 모바일에서는 한 줄에 나란히 */}
              <div className="flex gap-2 mt-3 md:mt-0">
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="flex-1 md:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                >
                  <option value="all">모든 유형</option>
                  <option value="individual">일반</option>
                  <option value="organization">기관</option>
                  <option value="admin">관리자</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="flex-1 md:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="suspended">정지</option>
                </select>
              </div>

              {/* 선택 항목 관리 버튼 - 데스크톱만 */}
              <button
                className="hidden md:block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                disabled={selectedUsers.length === 0}
                onClick={() => {
                  toast.success(`${selectedUsers.length}명의 사용자를 관리합니다.`);
                  setSelectedUsers([]);
                }}
              >
                선택 관리 ({selectedUsers.length})
              </button>
            </div>
          </div>

          {/* 데스크톱 테이블 뷰 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">권한</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          title="상세보기"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <strong>{totalElements}</strong>명 중 <strong>{totalElements > 0 ? startIndex : 0}-{endIndex}</strong> 표시
            </p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                // 현재 페이지 주변 5개만 표시
                if (
                  pageNum === 0 || // 첫 페이지
                  pageNum === totalPages - 1 || // 마지막 페이지
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2) // 현재 페이지 주변
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`px-3 py-1 border rounded-lg ${
                        pageNum === currentPage
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 3 ||
                  pageNum === currentPage + 3
                ) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              })}
              <button
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ConfirmModal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />
    </>
  );
};

export default UserManagementPage;
