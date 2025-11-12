import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Download,
  X,
  Loader2
} from 'lucide-react';
import PiggyBankPage from './PiggyBankPage';
import DonationHistoryPage from './DonationHistoryPage';
import { useAuthStore } from '../../stores/authStore';
import { useUserFavoriteProjects, useProjects, useToggleFavoriteProject } from '../../hooks/useProjects';
import type {
  UserType,
  UserProfile,
  DonationHistory,
  Project,
  PiggyBank
} from '../../types';

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
  donationHistory,
  favoriteProjects: _ignoredFavoriteProjects, // ✅ 하드코딩된 prop 무시
  piggyBanks,
  favoriteProjectIds: _ignoredFavoriteProjectIds, // ✅ 하드코딩된 prop 무시
  setFavoriteProjectIds,
  setSelectedProject,
}) => {
  const navigate = useNavigate();
  const { updateUser, isLoggedIn } = useAuthStore();
  const [selectedMenu, setSelectedMenu] = useState<'main' | 'profile-edit' | 'donation-history' | 'favorite-projects' | 'piggy-bank'>('main');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(projectId);
      // mutation의 onSuccess에서 자동으로 쿼리 무효화되어 UI 업데이트됨
    } catch (error) {
      console.error('관심 프로젝트 처리 실패:', error);
      alert('관심 프로젝트 처리 중 오류가 발생했습니다.');
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
    if (window.confirm('정산을 요청하시겠습니까?')) {
      alert('정산 요청이 완료되었습니다. 관리자 승인 후 처리됩니다.');
    }
  };

  // 비밀번호 변경 함수
  const handleChangePassword = (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    alert('비밀번호가 변경되었습니다.');
    setShowPasswordModal(false);
  };

  // 비밀번호 변경 모달
  const PasswordChangeModal: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
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

  // 마이페이지 메인
  const MyPageMain = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 lg:mb-12">마이페이지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
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
                    onClick={() => setSelectedMenu('piggy-bank')}
                    className="w-full py-3 text-left hover:bg-gray-50 rounded-lg px-4 font-semibold"
                  >
                    저금통 관리
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 lg:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">나의 기부 현황</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="p-4 md:p-6 bg-red-50 rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600 mb-2">총 기부 금액</p>
                  <p className="text-2xl md:text-3xl font-bold">{formatAmount(donationHistory.reduce((sum, d) => sum + d.amount, 0))}원</p>
                </div>
                <div className="p-4 md:p-6 bg-blue-50 rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600 mb-2">참여 프로젝트</p>
                  <p className="text-2xl md:text-3xl font-bold">{donationHistory.length}개</p>
                </div>
                <div className="p-4 md:p-6 bg-green-50 rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600 mb-2">관심 프로젝트</p>
                  <p className="text-2xl md:text-3xl font-bold">{favoriteProjects.length}개</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 lg:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">최근 기부 내역</h2>
              <div className="space-y-3 md:space-y-4">
                {donationHistory.slice(0, 3).map(donation => (
                  <div key={donation.id} className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 p-4 md:p-6 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-bold text-base md:text-lg mb-1">{donation.projectTitle}</p>
                      <p className="text-xs md:text-sm text-gray-500">{donation.date}</p>
                    </div>
                    <p className="font-bold text-xl md:text-2xl text-left sm:text-right">{formatAmount(donation.amount)}원</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

        alert('프로필이 수정되었습니다.');
        setSelectedMenu('main');
      } catch (error) {
        console.error('프로필 수정 실패:', error);
        alert('프로필 수정에 실패했습니다.');
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
    const isLoading = isFavoriteIdsLoading || isProjectsLoading;

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
              <span className="text-sm md:text-base text-gray-600">{favoriteProjects.length}개 프로젝트</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 md:py-20">
                <Loader2 className="animate-spin text-red-500" size={40} />
              </div>
            ) : favoriteProjects.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <Heart className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-base md:text-lg mb-4">관심 프로젝트가 없습니다.</p>
              <button
                onClick={() => navigate('/projects')}
                className="px-5 md:px-6 py-2.5 md:py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 text-sm md:text-base"
              >
                프로젝트 둘러보기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {favoriteProjects.map(project => {
                const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                return (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:border-red-500 transition-all bg-white relative"
                  >
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
                      <div className="h-48 bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center text-7xl">
                        {project.image}
                      </div>
                      <div className="p-5">
                        <div className="text-sm text-red-500 font-semibold mb-2">{project.category}</div>
                        <h3 className="text-lg font-bold mb-3 line-clamp-2">{project.title}</h3>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-red-500">{progress}%</span>
                            <span className="text-gray-500">D-{project.dday}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
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
      {selectedMenu === 'piggy-bank' && (
        <PiggyBankPage
          piggyBanks={piggyBanks}
          onBack={() => setSelectedMenu('main')}
        />
      )}
      {showPasswordModal && <PasswordChangeModal />}
    </>
  );
};

export default ProfilePage;
