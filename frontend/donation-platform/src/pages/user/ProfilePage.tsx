import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  FileText,
  User,
  Bell,
  ChevronRight,
  ChevronLeft,
  Gift,
  Star,
  TrendingUp,
  Award,
  Users,
  Lock,
  Mail,
  Phone,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import DonationHistoryPage from './DonationHistoryPage';
import StatisticsPage from './StatisticsPage';
import { useAuthStore } from '../../stores/authStore';
import { useUserFavoriteProjects, useProjects, useSettlementProjects, useClosedProjects, useToggleFavoriteProject } from '../../hooks/useProjects';
import { useOrganizationStats } from '../../hooks/useOrganization';
import { useMyDonations } from '../../hooks/useDonations';
import { useNotificationSettings, useUpdateNotificationSettings } from '../../hooks/useUsers';
import { deleteAccount, updateProfile, changePassword } from '../../api/users';
import type { NotificationSettingsResponse } from '../../api/users';
import type {
  UserType,
  UserProfile,
  DonationHistory,
  Project,
  PiggyBank as PiggyBankType
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
  piggyBanks: PiggyBankType[];
  favoriteProjectIds: Set<number>;
  setFavoriteProjectIds: (ids: Set<number>) => void;
  setSelectedProject: (project: Project) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  userType,
  userProfile,
  setUserProfile,
  donationHistory: _ignoredDonationHistory,
  favoriteProjects: _ignoredFavoriteProjects,
  piggyBanks,
  favoriteProjectIds: _ignoredFavoriteProjectIds,
  setFavoriteProjectIds,
  setSelectedProject,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUser, isLoggedIn, logout } = useAuthStore();  // user는 MyPageMain 안에서 가져옴

  // URL 파라미터에서 초기 탭 설정
  const getInitialTab = (): 'main' | 'profile-edit' | 'donation-history' | 'favorite-projects' | 'statistics' => {
    const tab = searchParams.get('tab');
    if (tab === 'favorite-projects' || tab === 'favorites') return 'favorite-projects';
    if (tab === 'donation-history' || tab === 'donations') return 'donation-history';
    if (tab === 'profile-edit') return 'profile-edit';
    if (tab === 'statistics') return 'statistics';
    return 'main';
  };

  const [selectedMenu, setSelectedMenu] = useState<'main' | 'profile-edit' | 'donation-history' | 'favorite-projects' | 'statistics'>(getInitialTab());
    
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // URL 파라미터 변경 시 탭 동기화
  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'favorite-projects' || tabParam === 'favorites') {
      setSelectedMenu('favorite-projects');
    } else if (tabParam === 'donation-history' || tabParam === 'donations') {
      setSelectedMenu('donation-history');
    } else if (tabParam === 'profile-edit') {
      setSelectedMenu('profile-edit');
    } else if (tabParam === 'statistics') {
      setSelectedMenu('statistics');
    } else if (!tabParam) {
      // tab 파라미터가 없으면 메인으로
      setSelectedMenu('main');
    }
  }, [tabParam]);

  // ✅ 실제 API로 기부 내역 조회
  const { data: donationHistoryData, isLoading: isDonationsLoading } = useMyDonations({});
  const donationHistory = React.useMemo(() => {
    if (!donationHistoryData?.content) return [];
    return donationHistoryData.content.map((d: any) => ({
      id: d.donationId || d.id,
      projectTitle: d.projectTitle || d.projectName || '프로젝트',
      amount: d.amount,
      date: d.donatedAt || d.createdAt,
      receiptNumber: d.receiptNumber || `R${d.donationId || d.id}`,
      status: d.status === 'COMPLETED' ? '완료' : '대기'
    }));
  }, [donationHistoryData]);

  const { data: favoriteProjectIds = [], isLoading: isFavoriteIdsLoading } = useUserFavoriteProjects(isLoggedIn);
  const { data: allProjectsData, isLoading: isProjectsLoading } = useProjects({});
  const { data: allSettlementProjectsData, isLoading: isSettlementProjectsLoading } = useSettlementProjects({});
  const { data: allClosedProjectsData, isLoading: isClosedProjectsLoading } = useClosedProjects({});

  // ACTIVE + 결산 중 + 종료 모든 프로젝트에서 관심 프로젝트 필터링
  const favoriteProjects = React.useMemo(() => {
    const activeProjects = allProjectsData?.content || [];
    const settlementProjects = allSettlementProjectsData?.content || [];
    const closedProjects = allClosedProjectsData?.content || [];
    const allProjects = [...activeProjects, ...settlementProjects, ...closedProjects];
    return allProjects.filter((p: Project) => favoriteProjectIds.includes(p.id));
  }, [allProjectsData, allSettlementProjectsData, allClosedProjectsData, favoriteProjectIds]);

  const toggleFavoriteMutation = useToggleFavoriteProject();

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const calculatePercentage = (current: number, target: number): number => {
    return Math.round((current / target) * 100);
  };

  const toggleFavoriteProject = async (projectId: number) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    try {
      await toggleFavoriteMutation.mutateAsync(projectId);
    } catch (error) {
      console.error('관심 프로젝트 처리 실패:', error);
      toast.error('관심 프로젝트 처리 중 오류가 발생했습니다.');
    }
  };

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

  const handleChangePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    try {
      // 백엔드 API 호출하여 비밀번호 변경
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('비밀번호가 변경되었습니다.');
      setShowPasswordModal(false);
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error);
      toast.error(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  // 비밀번호 변경 모달
  const PasswordChangeModal: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* 다크 헤더 */}
          <div className="bg-stone-900 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Lock className="text-amber-400" size={20} />
                </div>
                <h2 className="text-xl font-medium text-white">비밀번호 변경</h2>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">현재 비밀번호</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="현재 비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">새 비밀번호</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="새 비밀번호 (8자 이상)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-1.5">영문, 숫자, 특수문자를 포함하여 8자 이상</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="새 비밀번호 확인"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl font-medium text-stone-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleChangePassword(currentPassword, newPassword, confirmPassword)}
                className="flex-1 bg-amber-500 text-stone-900 py-3.5 rounded-xl font-medium hover:bg-amber-400 transition-colors"
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 회원 탈퇴 모달
  const DeleteAccountModal: React.FC = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [reason, setReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
      if (!password) {
        toast.error('비밀번호를 입력해주세요.');
        return;
      }
      if (confirmText !== '회원탈퇴') {
        toast.error("'회원탈퇴'를 정확히 입력해주세요.");
        return;
      }

      setIsDeleting(true);
      try {
        await deleteAccount({ password, reason });
        toast.success('회원 탈퇴가 완료되었습니다.');
        logout();
        navigate('/');
      } catch (error: any) {
        console.error('회원 탈퇴 실패:', error);
        toast.error(error.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      } finally {
        setIsDeleting(false);
        setShowDeleteAccountModal(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* 다크 헤더 */}
          <div className="bg-stone-900 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
                <h2 className="text-xl font-medium text-white">회원 탈퇴</h2>
              </div>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6">
            {/* 경고 메시지 */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm leading-relaxed">
                회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                기부 내역, 관심 프로젝트 등 모든 정보가 영구적으로 삭제됩니다.
              </p>
            </div>

            {/* 비밀번호 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                본인 확인을 위해 비밀번호를 입력해주세요
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 확인 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                확인을 위해 <span className="text-red-500 font-bold">'회원탈퇴'</span>를 입력해주세요
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 탈퇴 사유 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                탈퇴 사유 (선택)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="탈퇴 사유를 입력해주세요"
                rows={3}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl font-medium text-stone-700 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '탈퇴하기'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 마이페이지 메인
  const MyPageMain = () => {
    const { user } = useAuthStore();
    const totalDonation = donationHistory.reduce((sum: number, d: any) => sum + d.amount, 0);
    const projectCount = new Set(donationHistory.map((d: any) => d.projectTitle)).size;

    // 기관 통계 (기관 사용자인 경우만 사용)
    const { data: orgStats, isLoading: isOrgStatsLoading } = useOrganizationStats();

    // 알림 설정 API 연동
    const { data: notificationSettingsData, isLoading: isSettingsLoading } = useNotificationSettings();
    const updateSettingsMutation = useUpdateNotificationSettings();

    // API에서 가져온 설정을 간단한 형태로 변환
    const getSettingEnabled = (key: keyof NotificationSettingsResponse): boolean => {
      if (!notificationSettingsData) return true;
      return notificationSettingsData[key]?.enabled ?? true;
    };

    // 설정 토글 핸들러
    const handleToggleSetting = (key: keyof NotificationSettingsResponse) => {
      if (!notificationSettingsData) return;

      const currentValue = notificationSettingsData[key]?.enabled ?? true;
      const updatedSettings = {
        [key]: {
          ...notificationSettingsData[key],
          enabled: !currentValue
        }
      };

      updateSettingsMutation.mutate(updatedSettings, {
        onSuccess: () => {
          toast.success('알림 설정이 변경되었습니다.');
        },
        onError: () => {
          toast.error('알림 설정 변경에 실패했습니다.');
        }
      });
    };

    const getDaysSinceJoined = () => {
      if (!user?.createdAt) return 0;
      const joinDate = new Date(user.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    return (
      <div className="bg-stone-50 min-h-screen">
        {/* Hero Section - 홈페이지 스타일 적용 */}
        <section className="relative bg-stone-900 overflow-hidden">
          {/* 배경 패턴 - 홈페이지와 동일 */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

          <div className="relative max-w-5xl mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-4">My Page</p>
              <h1 className="text-3xl md:text-4xl text-white font-light mb-3">
                <span className="font-medium">{userProfile.name}</span>님의 나눔 여정
              </h1>
              <p className="text-stone-400 text-sm">
                {userType === 'organization' ? '단체 회원' : '개인 회원'} · 함께하신지 {getDaysSinceJoined()}일
              </p>
            </div>

            {/* Statistics - 홈페이지 Our Impact 스타일 */}
            {userType === 'organization' ? (
              // 기관 사용자용 통계
              <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
                <div className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <TrendingUp className="text-amber-600" size={22} />
                  </div>
                  <p className="text-xl md:text-2xl font-light text-white mb-1">
                    {isOrgStatsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `${formatAmount(orgStats?.totalFunding || 0)}원`
                    )}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm">누적 모금액</p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Award className="text-amber-600" size={22} />
                  </div>
                  <p className="text-xl md:text-2xl font-light text-white mb-1">
                    {isOrgStatsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `${orgStats?.totalProjects || 0}개`
                    )}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm">등록 프로젝트</p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <BarChart3 className="text-amber-600" size={22} />
                  </div>
                  <p className="text-xl md:text-2xl font-light text-white mb-1">
                    {isOrgStatsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `${orgStats?.activeProjects || 0}개`
                    )}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm">진행중 프로젝트</p>
                </div>
              </div>
            ) : (
              // 개인 사용자용 통계
              <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
                <div className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <TrendingUp className="text-amber-600" size={22} />
                  </div>
                  <p className="text-xl md:text-2xl font-light text-white mb-1">
                    {isDonationsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `${formatAmount(totalDonation)}원`
                    )}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm">총 기부 금액</p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Award className="text-amber-600" size={22} />
                  </div>
                  <p className="text-xl md:text-2xl font-light text-white mb-1">
                    {isDonationsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `${projectCount}개`
                    )}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm">참여 프로젝트</p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Heart className="text-amber-600" size={22} />
                  </div>
                  <p className="text-xl md:text-2xl font-light text-white mb-1">
                    {isFavoriteIdsLoading || isProjectsLoading || isSettlementProjectsLoading || isClosedProjectsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `${favoriteProjects.length}개`
                    )}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm">관심 프로젝트</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Menu & Content Section */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Menu */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-md">
                <h3 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <User size={14} className="text-amber-600" />
                  </div>
                  프로필
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => navigate('/profile?tab=profile-edit')}
                    className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                  >
                    <span>기본 정보 수정</span>
                    <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                  >
                    <span>비밀번호 변경</span>
                    <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                  </button>
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="w-full py-2.5 text-left hover:bg-red-50 rounded-lg px-3 text-sm text-red-500 flex items-center justify-between group"
                  >
                    <span>회원 탈퇴</span>
                    <ChevronRight size={16} className="text-stone-400 group-hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* 나의 활동 섹션 - 관리자(admin)는 표시하지 않음
                  - 일반 사용자(individual), 기관(organization)만 표시
                  - 다시 활성화하려면: {user?.userType !== 'admin' && ( 를 제거하고 맨 끝의 )} 도 제거
              */}
              {user?.userType !== 'admin' && (
                <div className="bg-white rounded-2xl p-5 shadow-md">
                  <h3 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <Gift size={14} className="text-amber-600" />
                    </div>
                    나의 활동
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => navigate('/profile?tab=donation-history')}
                      className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                    >
                      <span>기부 내역</span>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                    </button>
                    <button
                      onClick={() => navigate('/profile?tab=favorite-projects')}
                      className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                    >
                      <span>관심 프로젝트</span>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                    </button>
                    <button
                      onClick={() => navigate('/profile?tab=statistics')}
                      className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                    >
                      <span>나의 기부 통계</span>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                    </button>
                  </div>
                </div>
              )}

              {userType === 'organization' && (
                <div className="bg-white rounded-2xl p-5 shadow-md">
                  <h3 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <FileText size={14} className="text-amber-600" />
                    </div>
                    기관 대시보드
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => navigate('/organization/profile')}
                      className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                    >
                      <span>기관 프로필 관리</span>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                    </button>
                    <button
                      onClick={() => navigate('/projects/create')}
                      className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                    >
                      <span>프로젝트 등록</span>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                    </button>
                    <button
                      onClick={() => navigate('/organization/dashboard')}
                      className="w-full py-2.5 text-left hover:bg-amber-50 rounded-lg px-3 text-sm text-stone-600 flex items-center justify-between group"
                    >
                      <span>프로젝트 관리</span>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-amber-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* 최근 기부 내역 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-amber-600 uppercase tracking-[0.15em] text-xs mb-1">Recent Donations</p>
                    <h2 className="text-lg font-light text-stone-800">
                      최근 <span className="font-medium">기부 내역</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/profile?tab=donation-history')}
                    className="text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors flex items-center gap-1"
                  >
                    전체보기 <ChevronRight size={16} />
                  </button>
                </div>

                {isDonationsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : donationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                      <Heart className="text-stone-300" size={32} />
                    </div>
                    <p className="text-stone-500 mb-4">아직 기부 내역이 없습니다.</p>
                    <button
                      onClick={() => navigate('/projects')}
                      className="bg-amber-500 text-stone-900 px-6 py-3 font-medium hover:bg-amber-400 transition-colors"
                    >
                      프로젝트 둘러보기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donationHistory.slice(0, 3).map((donation: any) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Heart className="text-amber-500" size={18} fill="currentColor" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800 text-sm">{donation.projectTitle}</p>
                            <p className="text-xs text-stone-500">{donation.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-600">{formatAmount(donation.amount)}원</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            donation.status === '완료' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {donation.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 관심 프로젝트 미리보기 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-amber-600 uppercase tracking-[0.15em] text-xs mb-1">Favorite Projects</p>
                    <h2 className="text-lg font-light text-stone-800">
                      관심 <span className="font-medium">프로젝트</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/profile?tab=favorite-projects')}
                    className="text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors flex items-center gap-1"
                  >
                    전체보기 <ChevronRight size={16} />
                  </button>
                </div>

                {isFavoriteIdsLoading || isProjectsLoading || isSettlementProjectsLoading || isClosedProjectsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : favoriteProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                      <Star className="text-stone-300" size={32} />
                    </div>
                    <p className="text-stone-500 mb-4">관심 프로젝트가 없습니다.</p>
                    <button
                      onClick={() => navigate('/projects')}
                      className="bg-amber-500 text-stone-900 px-6 py-3 font-medium hover:bg-amber-400 transition-colors"
                    >
                      프로젝트 둘러보기
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {favoriteProjects.slice(0, 3).map((project: Project) => {
                      const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                      return (
                        <div
                          key={project.id}
                          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group border border-stone-100"
                          onClick={() => {
                            setSelectedProject(project);
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          <div className="h-28 bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center overflow-hidden">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <Heart size={32} className="text-white/50 group-hover:scale-110 transition-transform" />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-xs text-amber-600 font-medium mb-1">{getCategoryLabel(project.category)}</div>
                            <h4 className="text-sm font-medium text-stone-800 mb-2 line-clamp-1 group-hover:text-amber-600 transition-colors">{project.title}</h4>
                            <div className="w-full bg-stone-100 rounded-full h-1.5 mb-2">
                              <div
                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-stone-500">
                              <span className="font-medium text-amber-600">{progress}%</span>
                              <span>D-{project.dday}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 알림 설정 */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-amber-600 uppercase tracking-[0.15em] text-xs mb-1">Notification Settings</p>
                    <h2 className="text-lg font-light text-stone-800">
                      알림 <span className="font-medium">설정</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/notifications')}
                    className="text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors flex items-center gap-1"
                  >
                    상세 설정 <ChevronRight size={16} />
                  </button>
                </div>
                {isSettingsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { key: 'donation' as const, label: '기부 관련 알림', icon: Heart },
                      { key: 'project' as const, label: '프로젝트 관련 알림', icon: FileText },
                      { key: 'comment' as const, label: '댓글 알림', icon: Bell },
                      { key: 'deadline' as const, label: '마감 임박 알림', icon: Gift },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <item.icon size={14} className="text-amber-600" />
                          </div>
                          <span className="text-sm text-stone-700">{item.label}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getSettingEnabled(item.key)}
                            onChange={() => handleToggleSetting(item.key)}
                            disabled={updateSettingsMutation.isPending}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-50"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // 프로필 수정 페이지
  const ProfileEditPage = () => {
    const [name, setName] = useState(userProfile.name);
    const [email] = useState(userProfile.email);
    const [phone, setPhone] = useState(userProfile.phone);
    const [isLoading, setIsLoading] = useState(false);

    // 알림 설정 API 연동
    const { data: notificationSettingsData, isLoading: isSettingsLoading } = useNotificationSettings();
    const updateSettingsMutation = useUpdateNotificationSettings();

    // API에서 가져온 설정을 간단한 형태로 변환
    const getSettingEnabled = (key: keyof NotificationSettingsResponse): boolean => {
      if (!notificationSettingsData) return true;
      return notificationSettingsData[key]?.enabled ?? true;
    };

    // 설정 토글 핸들러
    const handleToggleSetting = (key: keyof NotificationSettingsResponse) => {
      if (!notificationSettingsData) return;

      const currentValue = notificationSettingsData[key]?.enabled ?? true;
      const updatedSettings = {
        [key]: {
          ...notificationSettingsData[key],
          enabled: !currentValue
        }
      };

      updateSettingsMutation.mutate(updatedSettings);
    };

    const handleSave = async () => {
      setIsLoading(true);
      try {
        // 백엔드 API 호출하여 DB에 저장
        const response = await updateProfile({
          email,
          userName: name,
          phone,
        });

        // 성공 시 로컬 상태 업데이트
        const updatedProfile: UserProfile = {
          name: response.userName,
          email: response.email,
          phone: response.phone,
          notificationSettings: userProfile.notificationSettings,
        };
        setUserProfile(updatedProfile);
        updateUser({ userName: response.userName, email: response.email, phone: response.phone });
        toast.success('프로필이 수정되었습니다.');
        navigate('/profile');
      } catch (error: any) {
        console.error('프로필 수정 실패:', error);
        toast.error(error.response?.data?.message || '프로필 수정에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="bg-stone-50 min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-stone-900 overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

          <div className="relative max-w-5xl mx-auto px-4 py-12">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 text-stone-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={16} />
              마이페이지로
            </button>
            <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-3">Edit Profile</p>
            <h1 className="text-2xl md:text-3xl text-white font-light">
              프로필 <span className="font-medium">수정</span>
            </h1>
          </div>
        </section>

        {/* Form */}
        <section className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* 기본 정보 섹션 */}
            <div className="p-6 md:p-8 border-b border-stone-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-600 uppercase tracking-[0.15em] text-xs">Basic Info</p>
                  <h3 className="text-base font-medium text-stone-800">기본 정보</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">이름</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    이메일 <span className="text-stone-400 text-xs font-normal">(변경 불가)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">전화번호</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="전화번호를 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 알림 설정 섹션 */}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Bell size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-amber-600 uppercase tracking-[0.15em] text-xs">Notifications</p>
                    <h3 className="text-base font-medium text-stone-800">알림 설정</h3>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors flex items-center gap-1"
                >
                  상세 설정 <ChevronRight size={16} />
                </button>
              </div>

              {isSettingsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: 'donation' as const, label: '기부 관련 알림', desc: '기부 완료, 영수증 발급 등' },
                    { key: 'project' as const, label: '프로젝트 관련 알림', desc: '관심 프로젝트 업데이트' },
                    { key: 'comment' as const, label: '댓글 알림', desc: '새 댓글, 답글 알림' },
                    { key: 'deadline' as const, label: '마감 임박 알림', desc: '프로젝트 마감 관련 알림' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                      <div>
                        <span className="text-sm font-medium text-stone-700">{item.label}</span>
                        <p className="text-xs text-stone-500 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={getSettingEnabled(item.key)}
                          onChange={() => handleToggleSetting(item.key)}
                          disabled={updateSettingsMutation.isPending}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-50"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-6 mt-6 border-t border-stone-100">
                <button
                  onClick={() => setSelectedMenu('main')}
                  className="flex-1 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl font-medium text-stone-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    '저장하기'
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // 관심 프로젝트 페이지
  const FavoriteProjectsPage = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'settlement' | 'closed'>('active');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [sortOption, setSortOption] = useState('최신순');
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 6;

    const { data: settlementProjectsData, isLoading: isSettlementLoading } = useSettlementProjects();
    const { data: closedProjectsData, isLoading: isClosedLoading } = useClosedProjects();

    const settlementProjectIdSet = React.useMemo(() => {
      if (!settlementProjectsData?.content) return new Set<number>();
      return new Set(settlementProjectsData.content.map((p: Project) => p.id));
    }, [settlementProjectsData]);

    const closedProjectIdSet = React.useMemo(() => {
      if (!closedProjectsData?.content) return new Set<number>();
      return new Set(closedProjectsData.content.map((p: Project) => p.id));
    }, [closedProjectsData]);

    const isLoading = isFavoriteIdsLoading || isProjectsLoading || isSettlementProjectsLoading || isSettlementLoading || isClosedLoading;

    const filteredFavoriteProjects = React.useMemo(() => {
      let projects = [...favoriteProjects];

      // 탭 필터
      if (activeTab === 'settlement') {
        projects = projects.filter(p => settlementProjectIdSet.has(p.id));
      } else if (activeTab === 'closed') {
        projects = projects.filter(p => closedProjectIdSet.has(p.id));
      } else {
        // active: 결산 중이나 종료가 아닌 프로젝트
        projects = projects.filter(p => !settlementProjectIdSet.has(p.id) && !closedProjectIdSet.has(p.id));
      }

      // 검색
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const getOrgName = (org: string | { organizationId: number; name: string; introduction: string; websiteUrl?: string; }) => {
          return typeof org === 'string' ? org : org?.name || '';
        };
        projects = projects.filter(p =>
          p.title.toLowerCase().includes(keyword) ||
          getOrgName(p.organization).toLowerCase().includes(keyword)
        );
      }

      // 카테고리
      if (selectedCategory !== '전체') {
        projects = projects.filter(p => getCategoryLabel(p.category) === selectedCategory);
      }

      // 정렬
      switch (sortOption) {
        case '마감임박순':
          projects.sort((a, b) => a.dday - b.dday);
          break;
        case '모금률순':
          projects.sort((a, b) =>
            calculatePercentage(b.currentAmount, b.targetAmount) -
            calculatePercentage(a.currentAmount, a.targetAmount)
          );
          break;
        default:
          projects.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      return projects;
    }, [favoriteProjects, activeTab, settlementProjectIdSet, closedProjectIdSet, searchKeyword, selectedCategory, sortOption]);

    const totalPages = Math.ceil(filteredFavoriteProjects.length / projectsPerPage);
    const currentProjects = filteredFavoriteProjects.slice(
      (currentPage - 1) * projectsPerPage,
      currentPage * projectsPerPage
    );

    return (
      <div className="bg-stone-50 min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-stone-900 overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

          <div className="relative max-w-5xl mx-auto px-4 py-12">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 text-stone-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={16} />
              마이페이지로
            </button>
            <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-3">Favorite Projects</p>
            <h1 className="text-2xl md:text-3xl text-white font-light">
              관심 <span className="font-medium">프로젝트</span>
            </h1>
            <p className="text-stone-400 text-sm mt-2">
              총 {favoriteProjects.length}개의 프로젝트를 관심 등록했습니다.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            {/* 개선된 탭 스타일 */}
            <div className="flex gap-2 mb-6 p-1 bg-stone-100 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'active'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                진행 중
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'settlement'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                결산 중
              </button>
              <button
                onClick={() => setActiveTab('closed')}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'closed'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                종료
              </button>
            </div>

            {/* 필터 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-white"
              >
                <option>전체</option>
                <option>아동복지</option>
                <option>노인복지</option>
                <option>동물보호</option>
                <option>환경보호</option>
                <option>의료지원</option>
                <option>교육</option>
              </select>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-white"
              >
                <option>최신순</option>
                <option>마감임박순</option>
                <option>모금률순</option>
              </select>
            </div>

            {/* 프로젝트 목록 */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden animate-pulse shadow-md">
                    <div className="h-36 bg-stone-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-stone-200 rounded w-16 mb-2"></div>
                      <div className="h-5 bg-stone-200 rounded mb-3"></div>
                      <div className="h-2 bg-stone-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFavoriteProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <Heart className="text-stone-300" size={32} />
                </div>
                <p className="text-stone-500 mb-4">관심 프로젝트가 없습니다.</p>
                <button
                  onClick={() => navigate('/projects')}
                  className="bg-amber-500 text-stone-900 px-6 py-3 font-medium hover:bg-amber-400 transition-colors"
                >
                  프로젝트 둘러보기
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProjects.map((project: Project) => {
                    const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                    return (
                      <div
                        key={project.id}
                        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all relative group cursor-pointer"
                        onClick={() => {
                          setSelectedProject(project);
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteProject(project.id);
                          }}
                          className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
                        >
                          <Heart size={18} className="text-amber-500" fill="currentColor" />
                        </button>

                        <div>
                          <div className="h-36 bg-gradient-to-br from-amber-200 to-orange-200 overflow-hidden">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Heart size={40} className="text-white/50 group-hover:scale-110 transition-transform" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="text-xs text-amber-600 font-medium mb-1">{getCategoryLabel(project.category)}</div>
                            <h3 className="font-medium text-stone-800 mb-3 line-clamp-2 text-sm group-hover:text-amber-600 transition-colors">{project.title}</h3>
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-medium text-amber-600 text-sm">{progress}%</span>
                                <span className="text-stone-400">D-{project.dday}</span>
                              </div>
                              <div className="w-full bg-stone-100 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-stone-500">
                              <span>{formatAmount(project.currentAmount)}원</span>
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {project.donors}명
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="mt-8"
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <>
      {selectedMenu === 'main' && <MyPageMain />}
      {selectedMenu === 'profile-edit' && <ProfileEditPage />}
      {selectedMenu === 'donation-history' && (
        <DonationHistoryPage onBack={() => navigate(-1)} />
      )}
      {selectedMenu === 'favorite-projects' && <FavoriteProjectsPage />}
      {selectedMenu === 'statistics' && (
        <StatisticsPage onBack={() => navigate(-1)} />
      )}
      {showPasswordModal && <PasswordChangeModal />}
      {showDeleteAccountModal && <DeleteAccountModal />}

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
