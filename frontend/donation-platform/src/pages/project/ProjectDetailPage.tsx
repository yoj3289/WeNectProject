import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Users, Share2, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Eye, EyeOff, Loader2, AlertCircle, ChevronLeft, ChevronRight, Trash2, FileText, Download, Calendar, Building2, Clock, Flag } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useProjectDetail, useToggleFavoriteProject, useUserFavoriteProjects, useDeleteProject } from '../../hooks/useProjects';
import { useDonors } from '../../hooks/useDonations';
import { useExpenses, useSettlementSummary } from '../../hooks/useExpenses';
import type { TabType, Project } from '../../types';
import { getCategoryLabel } from '../../types';
import DonationModal from '../../components/donation/DonationModal';
import SettlementSummaryTab from '../../components/project/SettlementSummaryTab';
import ExpenseListTab from '../../components/project/ExpenseListTab';
import ReceiptViewer from '../../components/project/ReceiptViewer';
import ProjectTimeline from '../../components/project/ProjectTimeline';
import { useAuthStore } from '../../stores/authStore';
import { sanitizeHTML } from '../../utils/sanitize';
import ReportModal from '../../components/common/ReportModal';
import type { ReportType } from '../../api/reports';
import { getProjectStatusLabel, getProjectStatusBadgeStyle, getProjectStatusBoxStyle } from '../../utils/projectStatus';
import '../../components/editor/editor.css';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

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
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    itemId: number;
    itemType: ReportType;
    itemTitle?: string;
  }>({ isOpen: false, itemId: 0, itemType: 'PROJECT' });

  // API: 프로젝트 상세 정보 조회
  const { data: project, isLoading: isLoadingProject, isError: isErrorProject, error: projectError } = useProjectDetail(projectId);

  // 프로젝트 상태 확인
  const isSettlementPhase = project && (
    project.status?.toLowerCase() === 'completed' ||
    project.status?.toLowerCase() === 'settlement' ||
    project.status?.toLowerCase() === 'closed'
  );

  // API: 기부자 목록 조회
  const { data: donors = [], isLoading: isLoadingDonors } = useDonors(projectId);

  // API: 지출 내역 조회 (결산 단계에서만)
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(projectId, isSettlementPhase || false);

  // API: 결산 요약 조회 (결산 단계에서만)
  const { data: settlement, isLoading: isLoadingSettlement } = useSettlementSummary(projectId, isSettlementPhase || false);

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
      '환경보호': { icon: <TreePine size={120} />, bgColor: 'from-lime-100 to-green-100' },
      '교육': { icon: <GraduationCap size={120} />, bgColor: 'from-purple-100 to-indigo-100' },
      '장애인복지': { icon: <Accessibility size={120} />, bgColor: 'from-rose-100 to-pink-100' }
    };
    return iconMap[category] || { icon: <Heart size={120} />, bgColor: 'from-amber-50 to-orange-50' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('링크가 복사되었습니다!');
    });
  };

  // Handlers
  const handleFavoriteClick = async () => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요한 서비스입니다.');
      onNavigateToLogin();
    } else {
      try {
        await toggleFavoriteMutation.mutateAsync(projectId);
      } catch (error: any) {
        toast.error(error.response?.data?.message || '관심 프로젝트 설정에 실패했습니다.');
      }
    }
  };

  const handleDonateClick = () => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요한 서비스입니다. 로그인 후 기부해주세요.');
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
      toast.success('프로젝트가 성공적으로 삭제되었습니다.');
      navigate('/projects');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '프로젝트 삭제에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setShowDeleteModal(false);
    }
  };

  // 로딩 상태
  if (isLoadingProject) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <LoadingSpinner
          size="xl"
          message="프로젝트 정보를 불러오는 중..."
          subMessage="잠시만 기다려주세요"
        />
      </div>
    );
  }

  // 에러 상태
  if (isErrorProject || !project) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-stone-600 mb-4">
            {(projectError as any)?.response?.data?.message || '프로젝트를 불러오는데 실패했습니다.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const progress = calculatePercentage(project.currentAmount, project.targetAmount);
  const isFavorite = isLoggedIn ? actualFavoriteIds.has(project.id) : false;
  const categoryKo = getCategoryLabel(project.category);
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
              className="text-stone-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(project.description) }}
            />
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* 기부금 사용계획 */}
            <div className="bg-amber-50/50 rounded-2xl p-4 sm:p-6 border border-amber-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-amber-600" />
                </div>
                <h4 className="font-medium text-base sm:text-lg text-stone-800">기부금 사용계획</h4>
              </div>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-wrap">
                {project.budgetPlan || '기부금 사용계획이 등록되지 않았습니다.'}
              </p>
            </div>

            {/* 상세 사용계획서 다운로드 */}
            {project.planDocumentUrl && project.isPlanPublic && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="text-stone-600" size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-stone-800">상세 사용계획서</p>
                      <p className="text-xs sm:text-sm text-stone-500 truncate">PDF 문서로 다운로드 가능합니다</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace('/api', '');
                        const fullUrl = project.planDocumentUrl?.startsWith('http')
                          ? project.planDocumentUrl
                          : `${backendBaseUrl}${project.planDocumentUrl}`;

                        // 인증 토큰 가져오기
                        const token = localStorage.getItem('accessToken');

                        const response = await fetch(fullUrl, {
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                        });
                        if (!response.ok) throw new Error('파일 다운로드 실패');

                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;

                        // 파일명 추출
                        const fileName = project.planDocumentUrl?.split('/').pop() || '사용계획서.pdf';
                        link.download = fileName;

                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);

                        toast.success('문서 다운로드 완료');
                      } catch (error) {
                        console.error('다운로드 오류:', error);
                        // 실패 시 새 탭에서 열기
                        const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace('/api', '');
                        const fullUrl = project.planDocumentUrl?.startsWith('http')
                          ? project.planDocumentUrl
                          : `${backendBaseUrl}${project.planDocumentUrl}`;
                        window.open(fullUrl, '_blank');
                      }
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors flex-shrink-0"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">다운로드</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'progress':
        // 결산 단계: 저금통 정보 + 지출 내역 표시
        if (isSettlementPhase) {
          return (
            <div className="space-y-6">
              {/* 결산 요약 */}
              {isLoadingSettlement ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-stone-600">결산 정보를 불러오는 중...</p>
                </div>
              ) : settlement ? (
                <SettlementSummaryTab summary={settlement} />
              ) : (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800">결산 정보를 불러올 수 없습니다.</p>
                </div>
              )}

              {/* 프로젝트 타임라인 (결산 단계) */}
              <ProjectTimeline
                project={project}
                expenses={expenses}
                settlement={settlement}
              />

              {/* 지출 내역 */}
              {isLoadingExpenses ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-stone-600">지출 내역을 불러오는 중...</p>
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-xl font-medium text-stone-800 mb-4">지출 내역 상세</h3>
                  <ExpenseListTab
                    expenses={expenses}
                    onReceiptClick={(expense) => setSelectedReceipt(expense)}
                  />
                </div>
              )}
            </div>
          );
        }

        // 모금 단계: 진행 현황 표시
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-amber-50/50 rounded-2xl p-3 sm:p-5 border border-amber-100">
                <p className="text-xs sm:text-sm text-stone-500 mb-1">현재 모금액</p>
                <p className="text-lg sm:text-2xl font-medium text-amber-600">{formatAmount(project.currentAmount)}원</p>
              </div>
              <div className="bg-stone-50 rounded-2xl p-3 sm:p-5 border border-stone-200">
                <p className="text-xs sm:text-sm text-stone-500 mb-1">목표 금액</p>
                <p className="text-lg sm:text-2xl font-medium text-stone-700">{formatAmount(project.targetAmount)}원</p>
              </div>
              <div className="bg-green-50/50 rounded-2xl p-3 sm:p-5 border border-green-100">
                <p className="text-xs sm:text-sm text-stone-500 mb-1">달성률</p>
                <p className="text-lg sm:text-2xl font-medium text-green-600">{progress}%</p>
              </div>
              <div className="bg-orange-50/50 rounded-2xl p-3 sm:p-5 border border-orange-100">
                <p className="text-xs sm:text-sm text-stone-500 mb-1">남은 기간</p>
                <p className="text-lg sm:text-2xl font-medium text-orange-600">D-{project.dday}</p>
              </div>
            </div>

            {/* 진행 타임라인 */}
            <ProjectTimeline
              project={project}
              expenses={[]}
              settlement={null}
            />
          </div>
        );
      case 'donors':
        return (
          <div className="space-y-6">
            {/* 기부자 통계 */}
            {isLoadingDonors ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                <p className="text-stone-600">기부자 정보를 불러오는 중...</p>
              </div>
            ) : donors.length === 0 ? (
              <div className="text-center py-16 text-stone-500">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <Heart className="text-stone-300" size={40} />
                </div>
                <p className="text-lg font-medium">아직 기부자가 없습니다</p>
                <p className="text-sm mt-2">첫 기부자가 되어주세요!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-amber-50/50 rounded-2xl p-3 sm:p-5 border border-amber-100 text-center">
                    <p className="text-xl sm:text-2xl font-medium text-stone-800">{donors.length}명</p>
                    <p className="text-xs sm:text-sm text-stone-500">총 기부자</p>
                  </div>
                  <div className="bg-green-50/50 rounded-2xl p-3 sm:p-5 border border-green-100 text-center">
                    <p className="text-xl sm:text-2xl font-medium text-stone-800">
                      {formatAmount(donors.reduce((sum, d) => sum + d.amount, 0))}원
                    </p>
                    <p className="text-xs sm:text-sm text-stone-500">총 기부금</p>
                  </div>
                </div>

                {/* 익명 기부자 토글 */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-stone-600">익명 기부자 표시</span>
                  <button
                    onClick={() => setShowAnonymousDonors(!showAnonymousDonors)}
                    className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
                  >
                    {showAnonymousDonors ? <Eye size={20} /> : <EyeOff size={20} />}
                    {showAnonymousDonors ? '표시 중' : '숨김'}
                  </button>
                </div>

                {/* 기부자 목록 */}
                <div className="space-y-3">
                  {donors
                    .filter(d => showAnonymousDonors || !d.isAnonymous)
                    .map((donor) => (
                      <div key={donor.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between hover:border-amber-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                            <Heart size={18} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">
                              {donor.isAnonymous ? '익명의 기부자' : donor.name}
                            </p>
                            <p className="text-sm text-stone-500">{donor.date}</p>
                          </div>
                        </div>
                        <p className="font-medium text-amber-600">
                          {formatAmount(donor.amount)}원
                        </p>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50/50 rounded-2xl p-4 sm:p-5 border border-amber-100 flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <Heart size={24} className="sm:hidden text-amber-500" fill="currentColor" />
                <Heart size={28} className="hidden sm:block text-amber-500" fill="currentColor" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-stone-500">응원 메시지</p>
                <p className="text-2xl sm:text-3xl font-medium text-stone-800">{donorsWithMessages.length}개</p>
              </div>
            </div>

            {isLoadingDonors ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                <p className="text-stone-600">응원 메시지를 불러오는 중...</p>
              </div>
            ) : donorsWithMessages.length === 0 ? (
              <div className="text-center py-16 text-stone-500">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <Heart className="text-stone-300" size={40} />
                </div>
                <p className="text-lg font-medium">아직 응원 메시지가 없습니다</p>
                <p className="text-sm mt-2">첫 응원 메시지를 남겨주세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donorsWithMessages.map((donor) => (
                  <div key={donor.id} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart size={20} className="sm:hidden text-amber-500" fill="currentColor" />
                        <Heart size={24} className="hidden sm:block text-amber-500" fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base text-stone-800 truncate">
                              {donor.isAnonymous ? '익명의 기부자' : donor.name}
                            </p>
                            <p className="text-xs sm:text-sm text-stone-500">{donor.date}</p>
                          </div>
                          <p className="font-medium text-sm sm:text-base text-amber-600 flex-shrink-0">
                            {formatAmount(donor.amount)}원
                          </p>
                        </div>
                        <div className="p-3 sm:p-4 bg-stone-50 rounded-xl">
                          <p className="text-sm sm:text-base text-stone-700 leading-relaxed">"{donor.message}"</p>
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
    <div className="bg-stone-50 min-h-screen">
      {/* 다크 헤더 - 간결하게 제목과 기본 정보만 */}
      <div className="bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          {/* 뒤로가기 */}
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-stone-400 hover:text-white font-medium text-sm flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={18} />
            프로젝트 목록
          </button>

          {/* 프로젝트 기본 정보 */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              {/* 배지들 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-medium">
                  {categoryKo}
                </span>
                {!isSettlementPhase && (
                  <span className="px-3 py-1 bg-stone-700 text-stone-300 rounded-full text-sm font-medium flex items-center gap-1">
                    <Clock size={14} />
                    D-{project.dday}
                  </span>
                )}
                {isSettlementPhase && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProjectStatusBadgeStyle(project.status)}`}>
                    {getProjectStatusLabel(project.status)}
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
                {project.title}
              </h1>

              {/* 기관명 */}
              <div className="flex items-center gap-2 text-stone-400">
                <Building2 size={16} />
                <span>{project.organization.name}</span>
              </div>
            </div>

            {/* 삭제/신고 버튼 */}
            <div className="flex gap-2">
              {isAuthor && (
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              )}
              {isLoggedIn && !isAuthor && (
                <button
                  onClick={() => setReportModal({
                    isOpen: true,
                    itemId: project.id,
                    itemType: 'PROJECT',
                    itemTitle: project.title
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors text-sm"
                >
                  <Flag size={16} />
                  신고
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 왼쪽: 이미지 + 탭 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 프로젝트 이미지 */}
            {project.images && project.images.length > 0 ? (
              <div className="relative bg-white rounded-2xl border border-stone-200 overflow-hidden group">
                <div className="aspect-video flex items-center justify-center bg-stone-100">
                  <img
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.images[currentImageIndex].imageUrl}`}
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) =>
                        prev === project.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <ChevronRight size={20} />
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
                        className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                            ? 'bg-amber-500 w-6'
                            : 'bg-stone-400/50 hover:bg-stone-400'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`bg-gradient-to-br ${categoryInfo.bgColor} rounded-2xl p-12 flex items-center justify-center border border-stone-200`}>
                <div className="text-stone-400">
                  {categoryInfo.icon}
                </div>
              </div>
            )}

            {/* 탭 영역 */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              {/* 탭 네비게이션 */}
              <div className="relative">
                <div className="flex border-b border-stone-100 bg-stone-50 overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'intro', label: '프로젝트 소개' },
                    { id: 'budget', label: '기부금 사용계획' },
                    { id: 'progress', label: '진행현황' },
                    { id: 'donors', label: '기부자 목록' },
                    { id: 'messages', label: '응원 메시지' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex-shrink-0 px-4 py-3.5 font-medium transition-all text-sm whitespace-nowrap ${activeTab === tab.id
                          ? 'text-amber-600 bg-white border-b-2 border-amber-500 -mb-px'
                          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* 스크롤 힌트 - 오른쪽 그라데이션 */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none md:hidden" />
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 - 모금 현황 */}
          <div className="lg:order-last order-first">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden lg:sticky lg:top-8">
              {/* 모금 현황 */}
              <div className="p-6 border-b border-stone-100">
                <p className="text-sm text-stone-500 mb-1">
                  {isSettlementPhase ? '최종 모금액' : '현재 모금액'}
                </p>
                <p className="text-3xl font-medium text-stone-900 mb-1">
                  {formatAmount(project.currentAmount)}원
                </p>
                <p className="text-sm text-stone-500">
                  목표 {formatAmount(project.targetAmount)}원
                </p>

                {/* 프로그레스 바 */}
                <div className="mt-4">
                  <div className="w-full bg-stone-100 rounded-full h-2.5">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-right text-sm text-amber-600 font-medium mt-1.5">{progress}%</p>
                </div>
              </div>

              {/* 참여 정보 */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Users size={18} className="text-stone-400" />
                    참여 인원
                  </span>
                  <span className="font-medium text-stone-800">{project.donors}명</span>
                </div>

                {!isSettlementPhase && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 flex items-center gap-2">
                      <Calendar size={18} className="text-stone-400" />
                      남은 기간
                    </span>
                    <span className="font-medium text-stone-800">D-{project.dday}</span>
                  </div>
                )}

                {/* 결산 단계 저금통 정보 */}
                {isSettlementPhase && settlement && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-sm text-green-700 font-medium mb-1">저금통 잔액</p>
                    <p className="text-xl font-medium text-green-600">
                      {formatAmount(settlement.remainingAmount)}원
                    </p>
                  </div>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div className="p-6 pt-0 space-y-3">
                {/* 관심 프로젝트 */}
                <button
                  onClick={handleFavoriteClick}
                  disabled={toggleFavoriteMutation.isPending}
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isFavorite
                      ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                      : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                >
                  {toggleFavoriteMutation.isPending ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  )}
                  {isFavorite ? '관심 프로젝트' : '관심 프로젝트 등록'}
                </button>

                {/* 기부하기 버튼 */}
                {!isSettlementPhase && (
                  <button
                    onClick={handleDonateClick}
                    className="w-full py-4 bg-amber-500 text-white rounded-xl font-medium text-lg hover:bg-amber-600 transition-colors"
                  >
                    기부하기
                  </button>
                )}

                {/* 링크 복사 */}
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="w-full py-3 border border-stone-200 rounded-xl hover:bg-stone-50 flex items-center justify-center gap-2 text-stone-600 transition-colors"
                >
                  <Share2 size={18} />
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

      {/* 영수증 뷰어 모달 */}
      {selectedReceipt && (
        <ReceiptViewer
          expense={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-medium text-stone-800">프로젝트 삭제</h3>
            </div>

            <p className="text-stone-600 mb-6">
              정말로 이 프로젝트를 삭제하시겠습니까?<br />
              <span className="text-red-500 font-medium">삭제된 프로젝트는 복구할 수 없습니다.</span><br />
              <span className="text-sm text-stone-500 mt-2 block">
                ※ 기부 내역은 보존됩니다.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteProjectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* 신고 모달 */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        itemId={reportModal.itemId}
        itemType={reportModal.itemType}
        itemTitle={reportModal.itemTitle}
      />
    </div>
  );
};

export default ProjectDetailPage;
