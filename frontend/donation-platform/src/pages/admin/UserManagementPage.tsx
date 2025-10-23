import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, X, Heart, FileText, Clock, Settings, Shield, LogOut, History } from 'lucide-react';
import type { AdminDashboardProps } from '../../types/admin';

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

  const users: User[] = [
    { id: 1, name: '김기부', email: 'donor@example.com', role: 'user', status: 'active', registeredDate: '2024-01-15', lastLogin: '2024-03-16 14:30', totalDonations: 1250000, donationCount: 12, projects: 8 },
    { id: 2, name: '박나눔', email: 'sharer@example.com', role: 'user', status: 'active', registeredDate: '2024-02-01', lastLogin: '2024-03-15 09:20', totalDonations: 850000, donationCount: 7, projects: 5 },
    { id: 3, name: '이사랑', email: 'love@example.com', role: 'organization_admin', status: 'active', registeredDate: '2024-01-20', lastLogin: '2024-03-16 16:45', totalDonations: 0, donationCount: 0, projects: 0 },
    { id: 4, name: '최관리', email: 'admin@example.com', role: 'super_admin', status: 'active', registeredDate: '2023-12-01', lastLogin: '2024-03-16 17:00', totalDonations: 0, donationCount: 0, projects: 0 },
    { id: 5, name: '정선행', email: 'good@example.com', role: 'user', status: 'suspended', registeredDate: '2024-02-10', lastLogin: '2024-03-10 11:30', totalDonations: 450000, donationCount: 4, projects: 3 },
  ];

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
    if (window.confirm(`사용자 상태를 "${getStatusLabel(status)}"로 변경하시겠습니까?`)) {
      alert('사용자 상태가 변경되었습니다.');
    }
  }, []);

  const handleChangeRole = () => {
    if (!roleChangeReason.trim()) {
      alert('권한 변경 사유를 입력해주세요.');
      return;
    }
    if (window.confirm(`사용자 권한을 "${getRoleLabel(selectedRole)}"로 변경하시겠습니까?`)) {
      alert('사용자 권한이 변경되었습니다.');
      setShowRoleModal(false);
      setRoleChangeReason('');
    }
  };

  const handleForceLogout = () => {
    if (window.confirm('이 사용자를 강제 로그아웃 하시겠습니까?')) {
      alert('사용자가 강제 로그아웃되었습니다.');
    }
  };

  const filteredUsers = users.filter(u => {
    const roleMatch = userTypeFilter === 'all' ||
      (userTypeFilter === '일반' && u.role === 'user') ||
      (userTypeFilter === '기관' && u.role === 'organization_admin') ||
      (userTypeFilter === '관리자' && u.role === 'super_admin');

    const statusMatch = userStatusFilter === 'all' || u.status === userStatusFilter;

    const searchMatch = userSearchTerm === '' ||
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase());

    return roleMatch && statusMatch && searchMatch;
  });

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
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
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">사용자 상세 정보</h2>
                <p className="text-sm text-gray-600 mt-1">사용자 활동 내역 및 정보를 확인하세요</p>
              </div>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 사용자 기본 정보 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{(selectedUser as User).name}</h3>
                    <p className="text-gray-600 mt-1">{(selectedUser as User).email}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRoleColor((selectedUser as User).role)}`}>
                    {getRoleLabel((selectedUser as User).role)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">가입일</p>
                    <p className="text-lg font-bold text-gray-800">{(selectedUser as User).registeredDate}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">마지막 로그인</p>
                    <p className="text-lg font-bold text-gray-800">{(selectedUser as User).lastLogin}</p>
                  </div>
                </div>
              </div>

              {/* 활동 통계 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-red-500" />
                  활동 통계
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">총 기부 금액</p>
                    <p className="text-2xl font-bold text-red-600">{(selectedUser as User).totalDonations.toLocaleString()}원</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">기부 횟수</p>
                    <p className="text-2xl font-bold text-pink-600">{(selectedUser as User).donationCount}회</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">참여 프로젝트</p>
                    <p className="text-2xl font-bold text-purple-600">{(selectedUser as User).projects}개</p>
                  </div>
                </div>
              </div>

              {/* 권한 및 로그 버튼 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-blue-500" />
                  권한 및 활동 관리
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedRole((selectedUser as User).role);
                      setShowRoleModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-semibold hover:bg-purple-100 transition"
                  >
                    <Shield size={18} />
                    권한 변경
                  </button>
                  <button
                    onClick={() => setShowActivityLog(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition"
                  >
                    <Clock size={18} />
                    활동 로그
                  </button>
                  <button
                    onClick={() => setShowRoleHistory(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition"
                  >
                    <History size={18} />
                    권한 이력
                  </button>
                </div>
              </div>

              {/* 관리 액션 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-gray-500" />
                  관리 액션
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => handleChangeUserStatus('active')}
                    className="px-4 py-3 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition"
                  >
                    활성화
                  </button>
                  <button
                    onClick={() => handleChangeUserStatus('inactive')}
                    className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    비활성화
                  </button>
                  <button
                    onClick={() => handleChangeUserStatus('suspended')}
                    className="px-4 py-3 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition"
                  >
                    정지
                  </button>
                  <button
                    onClick={handleForceLogout}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg font-semibold hover:bg-orange-100 transition"
                  >
                    <LogOut size={18} />
                    강제 로그아웃
                  </button>
                </div>
              </div>
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
          <div className="p-6 border-b border-gray-200 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="이름, 이메일로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">모든 유형</option>
              <option value="일반">일반</option>
              <option value="기관">기관관리자</option>
              <option value="관리자">최고관리자</option>
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="suspended">정지</option>
            </select>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedUsers.length === 0}
              onClick={() => {
                alert(`${selectedUsers.length}명의 사용자를 관리합니다.`);
                setSelectedUsers([]);
              }}
            >
              선택 항목 관리 ({selectedUsers.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">권한</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">가입일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">마지막 로그인</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{user.registeredDate}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg"
                          title="상세보기"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <strong>{filteredUsers.length}</strong>명 중 <strong>1-{filteredUsers.length}</strong> 표시
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>이전</button>
              <button className="px-3 py-1 border rounded-lg bg-red-500 text-white border-red-500">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>다음</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
