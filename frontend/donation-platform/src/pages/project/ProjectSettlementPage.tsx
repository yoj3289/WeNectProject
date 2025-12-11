import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Share2, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Loader2, ChevronLeft, ChevronRight, CheckCircle, FileText, Wallet, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
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

  const progress = calculatePercentage(project.currentAmount, project.targetAmount);
  const isFavorite = isLoggedIn ? actualFavoriteIds.has(project.id) : false;
  const categoryKo = getCategoryLabel(project.category);
  const categoryInfo = getCategoryIcon(categoryKo);

  // 프로젝트 상태에 따른 표시 정보
  const getStatusInfo = () => {
    switch (project.status.toUpperCase()) {
      case 'COMPLETED':
        return {
          badge: '모금 완료',
          badgeColor: 'bg-blue-500 text-white',
          title: '모금 완료',
          message: '정산 대기 중입니다',
          bgColor: 'from-blue-50 to-blue-100',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700'
        };
      case 'SETTLEMENT':
        return {
          badge: '결산 진행 중',
          badgeColor: 'bg-purple-500 text-white',
          title: '결산 진행 중',
          message: '저금통 관리 중입니다',
          bgColor: 'from-purple-50 to-purple-100',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700'
        };
      case 'CLOSED':
        return {
          badge: '프로젝트 완료',
          badgeColor: 'bg-green-500 text-white',
          title: '프로젝트 완료',
          message: '성공적으로 종료되었습니다',
          bgColor: 'from-green-50 to-green-100',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        };
      default:
        return {
          badge: '프로젝트 완료',
          badgeColor: 'bg-green-500 text-white',
          title: '프로젝트 완료',
          message: '성공적으로 종료되었습니다',
          bgColor: 'from-green-50 to-green-100',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // 탭 컨텐츠 렌더링 (결산 프로젝트 전용)
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
      case 'settlement':
        return settlement ? (
          <SettlementSummaryTab
            summary={settlement}
          />
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-stone-600">결산 정보를 불러오는 중...</p>
          </div>
        );
      case 'expenses':
        return isLoadingExpenses ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-stone-600">지출 내역을 불러오는 중...</p>
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
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-stone-600">영수증을 불러오는 중...</p>
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.badgeColor}`}>
                  <CheckCircle size={14} />
                  {statusInfo.badge}
                </span>
              </div>

              {/* 제목 */}
              <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
                {project.title}
              </h1>

              {/* 기관명 */}
              <div className="flex items-center gap-2 text-stone-400">
                <Building2 size={16} />
                <span>
                  {typeof project.organization === 'string' ? project.organization : project.organization.name}
                </span>
              </div>
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
                        prev === 0 ? (project.images?.length ?? 1) - 1 : prev - 1
                      )}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) =>
                        prev === (project.images?.length ?? 1) - 1 ? 0 : prev + 1
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
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-green-500 w-6'
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
              {/* 탭 네비게이션 (결산 프로젝트 전용) */}
              <div className="flex border-b border-stone-100 bg-stone-50">
                {[
                  { id: 'intro', label: '프로젝트 소개' },
                  { id: 'settlement', label: '최종 결과 & 저금통' },
                  { id: 'expenses', label: '지출 내역' },
                  { id: 'receipts', label: '영수증 갤러리' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 py-3.5 font-medium transition-all text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-amber-600 bg-white border-b-2 border-amber-500 -mb-px'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="lg:order-last order-first">
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden lg:sticky lg:top-8">
              {/* 모금 현황 */}
              <div className="p-6 border-b border-stone-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-sm text-stone-500">최종 모금액</p>
                </div>
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
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-right text-sm text-green-600 font-medium mt-1.5">{progress}% 달성</p>
                </div>
              </div>

              {/* 참여 정보 */}
              <div className="p-6 space-y-4">
                {/* 저금통 정보 */}
                {project.status.toUpperCase() === 'CLOSED' ? (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <p className="text-lg font-medium text-green-700">
                      프로젝트가 종료되었습니다
                    </p>
                    {settlement && (
                      <p className="text-xs text-green-600 mt-2">
                        총 사용액: {formatAmount(settlement.usedAmount)}원
                      </p>
                    )}
                  </div>
                ) : settlement && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-sm text-green-700 font-medium mb-1 flex items-center gap-2">
                      <Wallet size={16} />
                      저금통 잔액
                    </p>
                    <p className="text-xl font-medium text-green-600">
                      {formatAmount(settlement.remainingAmount)}원
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      사용액: {formatAmount(settlement.usedAmount)}원
                    </p>
                  </div>
                )}

                {/* 상태 안내 */}
                <div className={`p-4 bg-gradient-to-br ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-xl text-center`}>
                  <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${statusInfo.textColor}`} />
                  <p className={`font-medium mb-1 ${statusInfo.textColor}`}>{statusInfo.title}</p>
                  <p className={`text-sm ${statusInfo.textColor}`}>
                    {statusInfo.message}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Users size={18} className="text-stone-400" />
                    참여 인원
                  </span>
                  <span className="font-medium text-stone-800">{project.donors}명</span>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="p-6 pt-0 space-y-3">
                {/* 관심 프로젝트 */}
                <button
                  onClick={handleFavoriteClick}
                  disabled={toggleFavoriteMutation.isPending}
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isFavorite
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
