import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Users, Share2, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Eye, EyeOff, Loader2, AlertCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useProjectDetail, useToggleFavoriteProject, useUserFavoriteProjects, useDeleteProject } from '../../hooks/useProjects';
import { useDonors } from '../../hooks/useDonations';
import type { TabType } from '../../types';
import { getCategoryLabel } from '../../types';
import DonationModal from '../../components/donation/DonationModal';
import { useAuthStore } from '../../stores/authStore';
import '../../components/editor/editor.css';

interface ProjectDetailPageProps {
  projectId: number;
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onNavigateToLogin: () => void;
  onShowDonationModal: () => void;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  isLoggedIn,
  favoriteProjectIds,
  onNavigateToLogin,
  onShowDonationModal
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [showAnonymousDonors, setShowAnonymousDonors] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // API: 프로젝트 상세 정보 조회
  const { data: project, isLoading: isLoadingProject, isError: isErrorProject, error: projectError } = useProjectDetail(projectId);

  // API: 기부자 목록 조회
  const { data: donors = [], isLoading: isLoadingDonors } = useDonors(projectId);

  // API: 관심 프로젝트 토글
  const toggleFavoriteMutation = useToggleFavoriteProject();

  // API: 사용자의 관심 프로젝트 목록 조회 (로그인한 경우에만)
  const { data: userFavorites } = useUserFavoriteProjects(isLoggedIn);

  // API: 프로젝트 삭제
  const deleteProjectMutation = useDeleteProject();

  // 실제 서버에서 가져온 관심 프로젝트 목록을 Set으로 변환
  const actualFavoriteIds = new Set(Array.isArray(userFavorites) ? userFavorites : []);

  // 작성자 확인
  const isAuthor = user && project && user.userId === project.userId;

  // 로그인 후 기부 모달 자동 열기
  useEffect(() => {
    const openDonation = searchParams.get('openDonation');
    if (openDonation === 'true' && isLoggedIn) {
      setShowDonationModal(true);
      // URL에서 openDonation 파라미터 제거
      searchParams.delete('openDonation');
      setSearchParams(searchParams);
    }
  }, [isLoggedIn, searchParams, setSearchParams]);

  // Helper Functions
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const calculatePercentage = (current: number, target: number): number => {
    return Math.round((current / target) * 100);
  };

  // 카테고리별 아이콘과 색상 매핑
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, { icon: React.ReactNode, bgColor: string }> = {
      '아동복지': { icon: <Baby size={120} />, bgColor: 'from-pink-100 to-rose-100' },
      '동물보호': { icon: <Dog size={120} />, bgColor: 'from-cyan-100 to-teal-100' },
      '노인복지': { icon: <UserCircle size={120} />, bgColor: 'from-emerald-100 to-green-100' },
      '환경보호': { icon: <TreePine size={120} />, bgColor: 'from-red-100 to-orange-100' },
      '교육': { icon: <GraduationCap size={120} />, bgColor: 'from-purple-100 to-indigo-100' },
      '장애인복지': { icon: <Accessibility size={120} />, bgColor: 'from-rose-100 to-pink-100' }
    };
    return iconMap[category] || { icon: <Heart size={120} />, bgColor: 'from-gray-100 to-gray-200' };
  };

  // SNS 공유 함수
  const shareToSNS = (platform: string, projectTitle: string) => {
    const url = window.location.href;
    const text = `${projectTitle} - 따뜻한 나눔`;

    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      default:
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('링크가 복사되었습니다!');
    });
  };

  // Handlers
  const handleFavoriteClick = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      onNavigateToLogin();
    } else {
      try {
        await toggleFavoriteMutation.mutateAsync(projectId);
      } catch (error: any) {
        alert(error.response?.data?.message || '관심 프로젝트 설정에 실패했습니다.');
      }
    }
  };

  const handleDonateClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.\n로그인 후 기부해주세요.');
      // 현재 프로젝트 페이지 URL과 기부 모달 열기 플래그를 redirect 파라미터로 전달
      navigate(`/login?redirect=/projects/${projectId}&openDonation=true`);
      return;
    }
    setShowDonationModal(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      alert('프로젝트가 성공적으로 삭제되었습니다.');
      navigate('/projects'); // 프로젝트 목록 페이지로 이동
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '프로젝트 삭제에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setShowDeleteModal(false);
    }
  };

  // 로딩 상태
  if (isLoadingProject) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isErrorProject || !project) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {(projectError as any)?.response?.data?.message || '프로젝트를 불러오는데 실패했습니다.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const progress = calculatePercentage(project.currentAmount, project.targetAmount);
  // 서버에서 가져온 실제 관심 프로젝트 목록 사용 (로그인 시에만)
  const isFavorite = isLoggedIn ? actualFavoriteIds.has(project.id) : false;
  const categoryKo = getCategoryLabel(project.category); // 영어 -> 한글 변환
  const categoryInfo = getCategoryIcon(categoryKo);

  // 응원 메시지가 있는 기부자만 필터링
  const donorsWithMessages = donors.filter(d => d.message);

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'intro':
        return (
          <div className="prose max-w-none">
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          </div>
        );
      case 'progress':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-lg mb-4">모금 진행 현황</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">현재 모금액</p>
                  <p className="text-xl font-bold">{formatAmount(project.currentAmount)}원</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">목표 금액</p>
                  <p className="text-xl font-bold">{formatAmount(project.targetAmount)}원</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">달성률</p>
                  <p className="text-xl font-bold text-red-500">{progress}%</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">남은 기간</p>
                  <p className="text-xl font-bold">D-{project.dday}</p>
                </div>
              </div>
            </div>

            {/* 진행 타임라인 - 실제로는 백엔드에서 프로젝트 이력 API 호출 */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <h4 className="font-bold text-lg mb-4">진행 타임라인</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                  <div>
                    <p className="font-bold text-gray-800">프로젝트 시작</p>
                    <p className="text-sm text-gray-600">{project.startDate || '2024-02-01'}</p>
                  </div>
                </div>
                {progress >= 50 && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                    <div>
                      <p className="font-bold text-gray-800">50% 달성</p>
                      <p className="text-sm text-gray-600">진행 중</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mt-1"></div>
                  <div>
                    <p className="font-bold text-gray-400">목표 달성 예상</p>
                    <p className="text-sm text-gray-400">{project.endDate || '2024-03-30'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'donors':
        return (
          <div className="space-y-6">
            {/* 기부자 통계 */}
            {isLoadingDonors ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">기부자 목록을 불러오는 중...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">기부자 수</p>
                    <p className="text-3xl font-bold text-red-600">{donors.length}명</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">총 기부액</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {donors.length > 0
                        ? formatAmount(donors.reduce((sum, d) => sum + d.amount, 0))
                        : 0}원
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">최고 기부액</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {donors.length > 0
                        ? formatAmount(Math.max(...donors.map(d => d.amount)))
                        : 0}원
                    </p>
                  </div>
                </div>

                {/* 익명 표시 토글 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">익명 기부자 표시</span>
                  <button
                    onClick={() => setShowAnonymousDonors(!showAnonymousDonors)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      showAnonymousDonors
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {showAnonymousDonors ? <Eye size={18} /> : <EyeOff size={18} />}
                    {showAnonymousDonors ? '표시' : '숨김'}
                  </button>
                </div>

                {/* 기부자 목록 */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="font-bold text-lg">기부자 목록</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {donors.length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        <Users className="mx-auto mb-4 text-gray-300" size={64} />
                        <p className="text-lg font-semibold">아직 기부자가 없습니다</p>
                        <p className="text-sm mt-2">첫 번째 기부자가 되어주세요!</p>
                      </div>
                    ) : (
                      donors
                        .filter(donor => showAnonymousDonors || !donor.isAnonymous)
                        .map((donor) => (
                          <div key={donor.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                                  <Users size={20} className="text-red-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">
                                    {donor.isAnonymous ? '익명' : donor.name}
                                  </p>
                                  <p className="text-sm text-gray-500">{donor.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-red-600">
                                  {formatAmount(donor.amount)}원
                                </p>
                              </div>
                            </div>
                            {donor.message && (
                              <div className="mt-3 ml-13 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 italic">"{donor.message}"</p>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500">
              <p className="text-sm text-gray-600 mb-1">총 응원 메시지</p>
              <p className="text-2xl font-bold text-red-600">{donorsWithMessages.length}개</p>
            </div>

            {isLoadingDonors ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">응원 메시지를 불러오는 중...</p>
              </div>
            ) : donorsWithMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Heart className="mx-auto mb-4 text-gray-300" size={64} />
                <p className="text-lg font-semibold">아직 응원 메시지가 없습니다</p>
                <p className="text-sm mt-2">첫 응원 메시지를 남겨주세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donorsWithMessages.map((donor) => (
                  <div key={donor.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart size={24} className="text-red-600" fill="currentColor" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-800">
                              {donor.isAnonymous ? '익명' : donor.name}
                            </p>
                            <p className="text-sm text-gray-500">{donor.date}</p>
                          </div>
                          <p className="font-bold text-red-600">
                            {formatAmount(donor.amount)}원
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 leading-relaxed">"{donor.message}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 md:mb-6 text-gray-600 hover:text-gray-900 font-semibold text-sm md:text-base"
        >
          ← 목록으로
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* 프로젝트 이미지 슬라이드 */}
            {project.images && project.images.length > 0 ? (
              <div className="relative bg-black rounded-xl md:rounded-2xl overflow-hidden group">
                {/* 메인 이미지 */}
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <img
                    src={`http://localhost:8080${project.images[currentImageIndex].imageUrl}`}
                    alt={`${project.title} - 이미지 ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 이전/다음 버튼 */}
                {project.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) =>
                        prev === 0 ? project.images.length - 1 : prev - 1
                      )}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) =>
                        prev === project.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* 이미지 인디케이터 */}
                {project.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {project.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-white w-8'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* 이미지 카운터 */}
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {project.images.length}
                </div>
              </div>
            ) : (
              // 이미지가 없을 때 기본 카테고리 아이콘 표시
              <div className={`bg-gradient-to-br ${categoryInfo.bgColor} rounded-xl md:rounded-2xl p-8 md:p-12 lg:p-16 flex items-center justify-center`}>
                <div className="text-gray-400">
                  {categoryInfo.icon}
                </div>
              </div>
            )}

            {/* 프로젝트 상세 카드 (제목 + 탭) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* 프로젝트 헤더 */}
              <div className="p-4 md:p-6 lg:p-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-2 md:px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs md:text-sm font-semibold">
                    {categoryKo}
                  </span>
                  <span className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm font-semibold">
                    D-{project.dday}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3">{project.title}</h1>
                    <p className="text-base md:text-lg lg:text-xl text-gray-600">{project.organization.name}</p>
                  </div>

                  {/* 삭제 버튼 (작성자만 보임) */}
                  {isAuthor && (
                    <button
                      onClick={handleDeleteClick}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="프로젝트 삭제"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">삭제</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {[
                  { id: 'intro', label: '프로젝트 소개' },
                  { id: 'progress', label: '진행현황' },
                  { id: 'donors', label: '기부자 목록' },
                  { id: 'messages', label: '응원 메시지' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 py-3 md:py-4 font-semibold transition-colors text-sm md:text-base whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-red-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-4 md:p-6 lg:p-8">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-4 md:space-y-6 lg:order-last order-first">
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 lg:sticky lg:top-8">
              {/* 진행률 표시 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-4xl font-bold text-red-500">{progress}%</span>
                  <span className="px-3 py-1 bg-red-50 text-red-500 font-bold rounded-full">
                    D-{project.dday}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* 모금 정보 */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">현재 모금액</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(project.currentAmount)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">목표 금액</p>
                  <p className="text-lg font-semibold text-gray-600">
                    {formatAmount(project.targetAmount)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">참여 인원</p>
                  <p className="text-lg font-semibold flex items-center gap-1">
                    <Users size={18} />
                    {project.donors}명
                  </p>
                </div>
              </div>

              {/* 관심 프로젝트 버튼 */}
              <button
                onClick={handleFavoriteClick}
                disabled={toggleFavoriteMutation.isPending}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all mb-3 flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                  isFavorite
                    ? 'bg-red-50 text-red-500 border-2 border-red-500 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {toggleFavoriteMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Heart
                    size={20}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                )}
                {isFavorite ? '관심 프로젝트 등록됨' : '관심 프로젝트 등록'}
              </button>

              {/* 기부하기 버튼 */}
              <button
                onClick={handleDonateClick}
                className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all mb-3"
              >
                기부하기
              </button>

              {/* SNS 공유 버튼들 */}
              <div className="flex gap-2">
                <button
                  onClick={() => shareToSNS('facebook', project.title)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Facebook
                </button>
                <button
                  onClick={() => shareToSNS('twitter', project.title)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Twitter
                </button>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  링크 복사
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 기부하기 모달 */}
      {showDonationModal && (
        <DonationModal
          projectId={project.id}
          projectTitle={project.title}
          onClose={() => setShowDonationModal(false)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">프로젝트 삭제</h3>
            </div>

            <p className="text-gray-600 mb-6">
              정말로 이 프로젝트를 삭제하시겠습니까?<br />
              <span className="text-red-500 font-semibold">삭제된 프로젝트는 복구할 수 없습니다.</span><br />
              <span className="text-sm text-gray-500 mt-2 block">
                ※ 기부 내역은 보존됩니다.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteProjectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
