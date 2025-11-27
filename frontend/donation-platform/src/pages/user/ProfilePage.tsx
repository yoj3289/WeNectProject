import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Download,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import DonationHistoryPage from './DonationHistoryPage';
import { useAuthStore } from '../../stores/authStore';
import { useUserFavoriteProjects, useProjects, useSettlementProjects, useToggleFavoriteProject } from '../../hooks/useProjects';
import { useMyDonations } from '../../hooks/useDonations';
import { deleteAccount } from '../../api/users';
import type {
  UserType,
  UserProfile,
  DonationHistory,
  Project,
  PiggyBank
} from '../../types';
import { getCategoryLabel } from '../../types';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';

interface ProfilePageProps {
  userType: UserType;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  donationHistory: DonationHistory[];
  favoriteProjects: Project[];
  piggyBanks: PiggyBank[];
  favoriteProjectIds: Set<number>;
  setFavoriteProjectIds: (ids: Set<number>) => void;
  setSelectedProject: (project: Project) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  userType,
  userProfile,
  setUserProfile,
  donationHistory: _ignoredDonationHistory, // ✅ 하드코딩된 prop 무시
  favoriteProjects: _ignoredFavoriteProjects, // ✅ 하드코딩된 prop 무시
  piggyBanks,
  favoriteProjectIds: _ignoredFavoriteProjectIds, // ✅ 하드코딩된 prop 무시
  setFavoriteProjectIds,
  setSelectedProject,
}) => {
  const navigate = useNavigate();
  const { updateUser, isLoggedIn, logout } = useAuthStore();
  const [selectedMenu, setSelectedMenu] = useState<'main' | 'profile-edit' | 'donation-history' | 'favorite-projects'>('main');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // ✅ 실제 API로 기부 내역 조회
  const { data: donationHistoryData, isLoading: isDonationsLoading } = useMyDonations({});
  const donationHistory = React.useMemo(() => {
    if (!donationHistoryData?.content) return [];
    return donationHistoryData.content.map((d: any) => ({
      id: d.id,
      projectTitle: d.projectTitle || d.projectName || '프로젝트',
      amount: d.amount,
      date: d.donatedAt || d.createdAt,
      receiptNumber: d.receiptNumber || `R${d.id}`,
      status: d.status === 'COMPLETED' ? 'completed' : 'pending'
    }));
  }, [donationHistoryData]);

  // ✅ 실제 API로 관심 프로젝트 ID 조회
  const { data: favoriteProjectIds = [], isLoading: isFavoriteIdsLoading } = useUserFavoriteProjects(isLoggedIn);

  // ✅ 관심 프로젝트 ID 목록으로 프로젝트 전체 목록 조회 (필터링된 프로젝트만)
  const { data: allProjectsData, isLoading: isProjectsLoading } = useProjects({});
  const favoriteProjects = React.useMemo(() => {
    if (!allProjectsData?.content) return [];
    return allProjectsData.content.filter((p: Project) => favoriteProjectIds.includes(p.id));
  }, [allProjectsData, favoriteProjectIds]);

  // ✅ 관심 프로젝트 토글 mutation
  const toggleFavoriteMutation = useToggleFavoriteProject();

  // Helper Functions
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const calculatePercentage = (current: number, target: number): number => {
    return Math.round((current / target) * 100);
  };

  // ✅ 관심 프로젝트 토글 함수 (실제 API 호출)
  const toggleFavoriteProject = async (projectId: number) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(projectId);
      // mutation의 onSuccess에서 자동으로 쿼리 무효화되어 UI 업데이트됨
    } catch (error) {
      console.error('관심 프로젝트 처리 실패:', error);
      toast.error('관심 프로젝트 처리 중 오류가 발생했습니다.');
    }
  };

  // 영수증 다운로드 함수
  const downloadReceipt = (receiptNumber: string, projectTitle: string, amount: number) => {
    const content = `
기부금 영수증
-----------------
영수증 번호: ${receiptNumber}
프로젝트: ${projectTitle}
기부 금액: ${formatAmount(amount)}원
발급일: ${new Date().toLocaleDateString()}
-----------------
따뜻한 나눔
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `영수증_${receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 정산 요청 함수
  const handleSettlementRequest = (projectId: number) => {
    setConfirmModal({
      isOpen: true,
      title: '정산 요청',
      message: '정산을 요청하시겠습니까?',
      onConfirm: () => {
        toast.success('정산 요청이 완료되었습니다. 관리자 승인 후 처리됩니다.');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  // 비밀번호 변경 함수
  const handleChangePassword = (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    toast.success('비밀번호가 변경되었습니다.');
    setShowPasswordModal(false);
  };

  // 비밀번호 변경 모달
  const PasswordChangeModal: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 비밀번호 표시/숨김 state
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full bg-white rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">비밀번호 변경</h2>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">현재 비밀번호</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleChangePassword(currentPassword, newPassword, confirmPassword)}
            className="w-full mt-6 py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all"
          >
            변경하기
          </button>
        </div>
      </div>
    );
  };

  // 회원 탈퇴 모달
  const DeleteAccountModal: React.FC = () => {
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
      if (!password) {
        toast.error('비밀번호를 입력해주세요.');
        return;
      }

      setIsDeleting(true);
      try {
        await deleteAccount({ password, reason });
        toast.success('회원 탈퇴가 완료되었습니다. 30일 이내 로그인 시 탈퇴를 취소할 수 있습니다.');
        logout();
        navigate('/');
      } catch (error: any) {
        console.error('회원 탈퇴 실패:', error);
        toast.error(error?.response?.data?.message || '회원 탈퇴 중 오류가 발생했습니다.');
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full bg-white rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={28} />
              <h2 className="text-2xl font-bold">회원 탈퇴</h2>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* 경고 메시지 */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-semibold mb-2">⚠️ 탈퇴 시 유의사항</p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>회원 탈퇴 시 30일간 계정이 유예됩니다.</li>
              <li>30일 이내 로그인 시 탈퇴를 취소할 수 있습니다.</li>
              <li>30일 후 모든 데이터가 영구적으로 삭제됩니다.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="현재 비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">탈퇴 사유 (선택)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                rows={3}
                placeholder="탈퇴 사유를 입력해주세요 (선택사항)"
              />
            </div>
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full mt-6 py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                탈퇴 처리 중...
              </>
            ) : (
              '탈퇴하기'
            )}
          </button>
        </div>
      </div>
    );
  };

  // 마이페이지 메인
  const MyPageMain = () => {
    const { user } = useAuthStore();

    // 함께한 일수 계산
    const getDaysSinceJoined = () => {
      if (!user?.createdAt) return 0;
      const joinDate = new Date(user.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // 참여한 고유 프로젝트 개수 계산
    const getUniqueProjectCount = () => {
      const uniqueProjects = new Set(donationHistory.map((d: any) => d.projectTitle));
      return uniqueProjects.size;
    };

    // 이번 달 기부 횟수 계산
    const getThisMonthDonationCount = () => {
      const today = new Date();
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      return donationHistory.filter((donation: any) => {
        const donationDate = new Date(donation.date);
        return donationDate.getMonth() === thisMonth && donationDate.getFullYear() === thisYear;
      }).length;
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 lg:mb-12">마이페이지</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* 좌측 사이드바 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">프로필</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedMenu('profile-edit')}
                  className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                >
                  기본 정보 수정
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                >
                  비밀번호 변경
                </button>
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="w-full py-3 text-left hover:bg-red-50 rounded-lg px-4 font-semibold text-red-600 hover:text-red-700"
                >
                  회원 탈퇴
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold mb-6">나의 활동</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedMenu('donation-history')}
                    className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                  >
                    기부 내역
                  </button>
                  <button
                    onClick={() => setSelectedMenu('favorite-projects')}
                    className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                  >
                    관심 프로젝트
                  </button>
                </div>
              </div>

              {userType === 'organization' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-bold mb-6">내 프로젝트</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/projects/create')}
                      className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                    >
                      프로젝트 등록
                    </button>
                    <button
                      onClick={() => navigate('/organization/dashboard')}
                      className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                    >
                      프로젝트 관리
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 우측 메인 영역 */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {/* 프로필 헤더 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* 프로필 이미지 */}
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0">
                    {userProfile.name.charAt(0)}
                  </div>
                  {/* 프로필 정보 */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                      {userProfile.name}님,
                    </h2>
                    <p className="text-sm md:text-base text-gray-600">
                      함께한지 ♡{getDaysSinceJoined()}일이 되었어요.
                    </p>
                  </div>
                </div>
              </div>

              {/* 나의 기부 현황 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 lg:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">나의 기부 현황</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-4 md:p-6 bg-blue-50 rounded-xl">
                    <p className="text-xs md:text-sm text-gray-600 mb-2">참여 프로젝트</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">
                      {isDonationsLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        `${getUniqueProjectCount()}개`
                      )}
                    </p>
                  </div>
                  <div className="p-4 md:p-6 bg-green-50 rounded-xl">
                    <p className="text-xs md:text-sm text-gray-600 mb-2">관심 프로젝트</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">
                      {isFavoriteIdsLoading || isProjectsLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        `${favoriteProjects.length}개`
                      )}
                    </p>
                  </div>
                  <div className="p-4 md:p-6 bg-purple-50 rounded-xl">
                    <p className="text-xs md:text-sm text-gray-600 mb-2">이번 달 기부</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">
                      {isDonationsLoading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        `${getThisMonthDonationCount()}회`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 알림 설정 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 lg:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">알림 설정</h2>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-semibold text-sm md:text-base text-gray-700">기부 관련 알림</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userProfile.notificationSettings.donation}
                        onChange={(e) => {
                          const updated = { ...userProfile };
                          updated.notificationSettings.donation = e.target.checked;
                          setUserProfile(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-semibold text-sm md:text-base text-gray-700">프로젝트 관련 알림</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userProfile.notificationSettings.project}
                        onChange={(e) => {
                          const updated = { ...userProfile };
                          updated.notificationSettings.project = e.target.checked;
                          setUserProfile(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-semibold text-sm md:text-base text-gray-700">댓글 알림</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userProfile.notificationSettings.comment}
                        onChange={(e) => {
                          const updated = { ...userProfile };
                          updated.notificationSettings.comment = e.target.checked;
                          setUserProfile(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-semibold text-sm md:text-base text-gray-700">뉴스레터 수신</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userProfile.notificationSettings.newsletter}
                        onChange={(e) => {
                          const updated = { ...userProfile };
                          updated.notificationSettings.newsletter = e.target.checked;
                          setUserProfile(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 프로필 수정 페이지 (PasswordChangeModal과 동일한 패턴 - 개별 state 사용)
  const ProfileEditPage = () => {
    // ✅ 각 필드마다 독립적인 primitive state 사용 (부모 state에 의존하지 않음)
    const [name, setName] = useState(userProfile.name);
    const [email, setEmail] = useState(userProfile.email);
    const [phone, setPhone] = useState(userProfile.phone);
    const [donation, setDonation] = useState(userProfile.notificationSettings.donation);
    const [project, setProject] = useState(userProfile.notificationSettings.project);
    const [comment, setComment] = useState(userProfile.notificationSettings.comment);
    const [newsletter, setNewsletter] = useState(userProfile.notificationSettings.newsletter);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
      setIsLoading(true);

      try {
        // TODO: 실제 API 호출로 변경 필요
        // await updateProfile({ email, userName: name, phone });
        // await updateNotificationSettings({ ... });

        // 1. App.tsx의 userProfile state 업데이트
        const updatedProfile: UserProfile = {
          name,
          email,
          phone,
          notificationSettings: {
            donation,
            project,
            comment,
            newsletter,
          },
        };
        setUserProfile(updatedProfile);

        // 2. Zustand store의 user 객체도 업데이트 (우측 상단 이름 반영)
        updateUser({
          userName: name,
          email: email,
          phone: phone,
        });

        toast.success('프로필이 수정되었습니다.');
        setSelectedMenu('main');
      } catch (error) {
        console.error('프로필 수정 실패:', error);
        toast.error('프로필 수정에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
          <button
            onClick={() => setSelectedMenu('main')}
            className="mb-6 md:mb-8 text-gray-600 hover:text-gray-900 font-semibold text-sm md:text-base"
          >
            ← 마이페이지로
          </button>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">프로필 수정</h2>

            <div className="space-y-6 md:space-y-8">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">기본 정보</h3>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">이름</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">전화번호</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* 알림 설정 */}
              <div className="pt-6 md:pt-8 border-t border-gray-200">
                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">알림 설정</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold">기부 관련 알림</span>
                    <input
                      type="checkbox"
                      checked={donation}
                      onChange={(e) => setDonation(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold">프로젝트 관련 알림</span>
                    <input
                      type="checkbox"
                      checked={project}
                      onChange={(e) => setProject(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold">댓글 알림</span>
                    <input
                      type="checkbox"
                      checked={comment}
                      onChange={(e) => setComment(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold">뉴스레터 수신</span>
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="flex gap-3 md:gap-4 pt-6 md:pt-8">
                <button
                  onClick={() => setSelectedMenu('main')}
                  disabled={isLoading}
                  className="flex-1 py-3 md:py-4 border border-gray-300 text-gray-700 rounded-lg font-bold text-base md:text-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-3 md:py-4 bg-red-500 text-white rounded-lg font-bold text-base md:text-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 관심 프로젝트 페이지
  const FavoriteProjectsPage = () => {
    // State
    const [activeTab, setActiveTab] = useState<'active' | 'settlement'>('active');
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [sortOption, setSortOption] = useState<string>('최신순');
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 12; // 한 페이지에 표시할 프로젝트 수

    // Debounce: 사용자 입력 500ms 후 검색 실행
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchKeyword(searchKeyword);
        setCurrentPage(1); // 검색 시 첫 페이지로 이동
      }, 500);
      return () => clearTimeout(timer);
    }, [searchKeyword]);

    // 필터 변경 시 첫 페이지로 이동
    useEffect(() => {
      setCurrentPage(1);
    }, [selectedCategory, sortOption, activeTab]);

    // API: 진행 중인 프로젝트 목록 조회 (ACTIVE)
    const { data: activeProjectsData, isLoading: isActiveLoading } = useProjects({
      status: 'approved',
      category: selectedCategory === '전체' ? undefined : selectedCategory,
      search: debouncedSearchKeyword.trim() || undefined,
      sortBy: sortOption === '최신순' ? 'latest' : sortOption === '마감임박순' ? 'deadline' : 'fundingRate',
      page: currentPage - 1, // 백엔드는 0부터 시작
      size: pageSize,
    });

    // API: 결산 중/종료된 프로젝트 목록 조회 (COMPLETED, SETTLEMENT, CLOSED)
    const { data: settlementProjectsData, isLoading: isSettlementLoading } = useSettlementProjects({
      category: selectedCategory === '전체' ? undefined : selectedCategory,
      search: debouncedSearchKeyword.trim() || undefined,
      sortBy: sortOption === '최신순' ? 'latest' : sortOption === '마감임박순' ? 'deadline' : 'fundingRate',
      page: currentPage - 1, // 백엔드는 0부터 시작
      size: pageSize,
    });

    // 현재 탭에 따라 전체 프로젝트 데이터 선택
    const allProjectsData = activeTab === 'active' ? activeProjectsData : settlementProjectsData;
    const allProjects = allProjectsData?.content || [];
    const isLoading = activeTab === 'active' ? isActiveLoading : isSettlementLoading;

    // 관심 프로젝트만 필터링
    const filteredFavoriteProjects = allProjects.filter((project: Project) =>
      favoriteProjectIds.includes(project.id)
    );

    // 관심 프로젝트의 페이지네이션 정보 (백엔드 페이지네이션 그대로 사용)
    const totalPages = allProjectsData?.totalPages || 1;

    const handleCategoryReset = () => {
      setSelectedCategory('전체');
      setSearchKeyword('');
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
          <button
            onClick={() => setSelectedMenu('main')}
            className="mb-6 md:mb-8 text-gray-600 hover:text-gray-900 font-semibold text-sm md:text-base"
          >
            ← 마이페이지로
          </button>

          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
              <h2 className="text-2xl md:text-3xl font-bold">관심 프로젝트</h2>
              <span className="text-sm md:text-base text-gray-600">{filteredFavoriteProjects.length}개 프로젝트</span>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex gap-2 mb-4 border-b border-gray-300">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 font-semibold transition-colors text-sm md:text-base ${
                  activeTab === 'active'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                진행 중
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`px-4 py-2 font-semibold transition-colors text-sm md:text-base ${
                  activeTab === 'settlement'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                결산 중
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              {/* 검색창 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm"
                />
                {isLoading && searchKeyword !== debouncedSearchKeyword && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                )}
              </div>

              {/* 카테고리 필터 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer text-sm"
              >
                <option>전체</option>
                <option>아동복지</option>
                <option>노인복지</option>
                <option>동물보호</option>
                <option>환경보호</option>
                <option>의료지원</option>
                <option>교육</option>
              </select>

              {/* 정렬 옵션 */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer text-sm"
              >
                <option>최신순</option>
                <option>마감임박순</option>
                <option>모금률순</option>
              </select>
            </div>

            {/* 필터 결과 표시 */}
            {(selectedCategory !== '전체' || searchKeyword.trim()) && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {selectedCategory !== '전체' && (
                    <>
                      <span className="font-bold text-gray-900">{selectedCategory}</span> 카테고리
                    </>
                  )}
                  {searchKeyword.trim() && (
                    <>
                      {selectedCategory !== '전체' && ' / '}
                      <span className="font-bold text-gray-900">"{searchKeyword}"</span> 검색 결과
                    </>
                  )}
                  <span className="font-bold text-red-500 ml-2">{filteredFavoriteProjects.length}개</span>
                </p>
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-5">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFavoriteProjects.length === 0 ? (
              <div className="text-center py-12">
                {favoriteProjectIds.length === 0 ? (
                  <>
                    <Heart className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 text-base mb-4">관심 프로젝트가 없습니다.</p>
                    <button
                      onClick={() => navigate('/projects')}
                      className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 text-sm"
                    >
                      프로젝트 둘러보기
                    </button>
                  </>
                ) : (
                  <>
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 text-base mb-4">
                      {searchKeyword.trim()
                        ? '검색 결과가 없습니다.'
                        : '해당 카테고리에 관심 프로젝트가 없습니다.'
                      }
                    </p>
                    <button
                      onClick={handleCategoryReset}
                      className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 text-sm"
                    >
                      전체 관심 프로젝트 보기
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredFavoriteProjects.map((project: Project) => {
                    const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                    const categoryKo = getCategoryLabel(project.category);

                    return (
                      <div
                        key={project.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-red-500 transition-all bg-white relative"
                      >
                        {/* 관심 프로젝트 하트 버튼 (항상 채워진 상태) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteProject(project.id);
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={24}
                            className="text-red-500"
                            fill="currentColor"
                          />
                        </button>

                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedProject(project);
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          <div className="h-48 bg-gradient-to-br from-red-100 to-pink-100 overflow-hidden">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-7xl">📦</div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-7xl">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            <div className="text-sm text-red-500 font-semibold mb-2">{categoryKo}</div>
                            <h3 className="text-lg font-bold mb-3 line-clamp-2">{project.title}</h3>

                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-red-500">{progress}%</span>
                                <span className="text-gray-500">D-{project.dday}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{formatAmount(project.currentAmount)}원</span>
                              <span>{project.donors}명 참여</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="mt-6"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 렌더링
  return (
    <>
      {selectedMenu === 'main' && <MyPageMain />}
      {selectedMenu === 'profile-edit' && <ProfileEditPage />}
      {selectedMenu === 'donation-history' && (
        <DonationHistoryPage onBack={() => setSelectedMenu('main')} />
      )}
      {selectedMenu === 'favorite-projects' && <FavoriteProjectsPage />}
      {showPasswordModal && <PasswordChangeModal />}
      {showDeleteAccountModal && <DeleteAccountModal />}

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        isDanger={confirmModal.isDanger}
      />
    </>
  );
};

export default ProfilePage;
