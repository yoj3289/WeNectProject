import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Share2, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useToggleFavoriteProject, useUserFavoriteProjects } from '../../hooks/useProjects';
import { useExpenses, useSettlementSummary } from '../../hooks/useExpenses';
import type { TabType, Project, Expense } from '../../types';
import { getCategoryLabel } from '../../types';
import SettlementSummaryTab from '../../components/project/SettlementSummaryTab';
import ExpenseListTab from '../../components/project/ExpenseListTab';
import ReceiptGalleryTab from '../../components/project/ReceiptGalleryTab';
import ReceiptViewer from '../../components/project/ReceiptViewer';
import { sanitizeHTML } from '../../utils/sanitize';
import '../../components/editor/editor.css';

interface ProjectSettlementPageProps {
  projectId: number;
  project: Project;
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onNavigateToLogin: () => void;
}

/**
 * 결산/완료된 프로젝트 상세 페이지
 * - 프로젝트 소개, 최종 결과 & 저금통, 지출 내역, 영수증 갤러리 표시
 * - 기부하기 버튼은 표시하지 않음
 */
const ProjectSettlementPage: React.FC<ProjectSettlementPageProps> = ({
  projectId,
  project,
  isLoggedIn,
  favoriteProjectIds,
  onNavigateToLogin
}) => {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState<Expense | null>(null);

  // API: 지출 내역 조회
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses(projectId, true);

  // API: 결산 요약 조회
  const { data: settlement, isLoading: isLoadingSettlement } = useSettlementSummary(projectId, true);

  // API: 관심 프로젝트 토글
  const toggleFavoriteMutation = useToggleFavoriteProject();

  // API: 사용자의 관심 프로젝트 목록 조회 (로그인한 경우에만)
  const { data: userFavorites } = useUserFavoriteProjects(isLoggedIn);

  // 실제 서버에서 가져온 관심 프로젝트 목록을 Set으로 변환
  const actualFavoriteIds = new Set(Array.isArray(userFavorites) ? userFavorites : []);

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

  const progress = calculatePercentage(project.currentAmount, project.targetAmount);
  const isFavorite = isLoggedIn ? actualFavoriteIds.has(project.id) : false;
  const categoryKo = getCategoryLabel(project.category);
  const categoryInfo = getCategoryIcon(categoryKo);

  // 탭 컨텐츠 렌더링 (결산 프로젝트 전용)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'intro':
        return (
          <div className="prose max-w-none">
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(project.description) }}
            />
          </div>
        );
      case 'settlement':
        return settlement ? (
          <SettlementSummaryTab
            summary={settlement}
          />
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">결산 정보를 불러오는 중...</p>
          </div>
        );
      case 'expenses':
        return isLoadingExpenses ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">지출 내역을 불러오는 중...</p>
          </div>
        ) : (
          <ExpenseListTab
            expenses={expenses}
            onReceiptClick={(expense) => setSelectedReceipt(expense)}
          />
        );
      case 'receipts':
        return isLoadingExpenses ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">영수증을 불러오는 중...</p>
          </div>
        ) : (
          <ReceiptGalleryTab
            expenses={expenses}
            onReceiptClick={(expense) => setSelectedReceipt(expense)}
          />
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
                        prev === 0 ? (project.images?.length ?? 1) - 1 : prev - 1
                      )}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) =>
                        prev === (project.images?.length ?? 1) - 1 ? 0 : prev + 1
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
                  <span className="px-2 md:px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1">
                    <CheckCircle size={14} />
                    프로젝트 완료
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3">{project.title}</h1>
                    <p className="text-base md:text-lg lg:text-xl text-gray-600">
                      {typeof project.organization === 'string' ? project.organization : project.organization.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* 탭 네비게이션 (결산 프로젝트 전용) */}
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {[
                  { id: 'intro', label: '프로젝트 소개' },
                  { id: 'settlement', label: '최종 결과 & 저금통' },
                  { id: 'expenses', label: '지출 내역' },
                  { id: 'receipts', label: '영수증 갤러리' }
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
                  <span className="text-4xl font-bold text-green-500">{progress}%</span>
                  <span className="px-3 py-1 bg-green-50 text-green-500 font-bold rounded-full flex items-center gap-1">
                    <CheckCircle size={16} />
                    완료
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* 모금 정보 */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">최종 모금액</p>
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

              {/* 프로젝트 완료 안내 */}
              <div className="mb-3 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-green-700 mb-1">프로젝트 완료</p>
                <p className="text-sm text-green-600">
                  성공적으로 종료되었습니다
                </p>
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

              {/* 링크 복사 버튼 */}
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Share2 size={20} />
                링크 복사
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 영수증 뷰어 모달 */}
      {selectedReceipt && (
        <ReceiptViewer
          expense={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default ProjectSettlementPage;
