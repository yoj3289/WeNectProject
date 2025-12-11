import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Heart, FileText, Baby, Dog, UserCircle, TreePine, GraduationCap, AlertCircle, Users, Sparkles, TrendingUp, Clock, CheckCircle2, ArrowRight, ChevronDown, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useProjects, useSettlementProjects, useClosedProjects, useToggleFavoriteProject, useUserFavoriteProjects, usePopularProjects } from '../../hooks/useProjects';
import { useRecentDonations } from '../../hooks/useDonations';
import type { Project } from '../../types';
import { getCategoryLabel } from '../../types';
import Pagination from '../../components/common/Pagination';

interface ProjectListPageProps {
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onProjectSelect: (project: Project) => void;
  onNavigateToLogin: () => void;
}

// 카테고리 데이터
const categories = [
  { name: '전체', icon: Sparkles },
  { name: '아동복지', icon: Baby },
  { name: '노인복지', icon: UserCircle },
  { name: '동물보호', icon: Dog },
  { name: '환경보호', icon: TreePine },
  { name: '의료지원', icon: Heart },
  { name: '교육', icon: GraduationCap },
];

const ProjectListPage: React.FC<ProjectListPageProps> = ({
  isLoggedIn,
  favoriteProjectIds,
  onProjectSelect,
  onNavigateToLogin
}) => {
  const [searchParams] = useSearchParams();
  const sortByParam = searchParams.get('sortBy');
  const statusParam = searchParams.get('status');

  // State
  const [activeTab, setActiveTab] = useState<'active' | 'settlement' | 'closed'>(
    statusParam === 'settlement' ? 'settlement' : statusParam === 'closed' ? 'closed' : 'active'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const pageSize = 12;

  // 페이지 진입 시 스크롤 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const newSortOption = sortByParam || 'latest';
    setSortOption(newSortOption);
  }, [sortByParam]);

  // URL status 파라미터로 탭 변경
  useEffect(() => {
    if (statusParam === 'settlement') {
      setActiveTab('settlement');
    } else if (statusParam === 'active' || !statusParam) {
      setActiveTab('active');
    }
  }, [statusParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortOption, activeTab]);

  // API 호출
  const { data: popularProjects, isLoading: popularLoading } = usePopularProjects(4);
  const { data: recentDonations } = useRecentDonations(5);

  const { data: activeProjects, isLoading: isActiveLoading, isError: isActiveError, error: activeError, refetch: refetchActive } = useProjects({
    status: 'approved',
    category: selectedCategory === '전체' ? undefined : selectedCategory,
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1,
    size: pageSize,
  });

  const { data: settlementProjects, isLoading: isSettlementLoading, isError: isSettlementError, error: settlementError, refetch: refetchSettlement } = useSettlementProjects({
    category: selectedCategory === '전체' ? undefined : selectedCategory,
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1,
    size: pageSize,
  });

  const { data: closedProjects, isLoading: isClosedLoading, isError: isClosedError, error: closedError, refetch: refetchClosed } = useClosedProjects({
    category: selectedCategory === '전체' ? undefined : selectedCategory,
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1,
    size: pageSize,
  });

  const projects = activeTab === 'active' ? activeProjects : activeTab === 'settlement' ? settlementProjects : closedProjects;
  const isLoading = activeTab === 'active' ? isActiveLoading : activeTab === 'settlement' ? isSettlementLoading : isClosedLoading;
  const isError = activeTab === 'active' ? isActiveError : activeTab === 'settlement' ? isSettlementError : isClosedError;
  const error = activeTab === 'active' ? activeError : activeTab === 'settlement' ? settlementError : closedError;
  const refetch = activeTab === 'active' ? refetchActive : activeTab === 'settlement' ? refetchSettlement : refetchClosed;

  const toggleFavoriteMutation = useToggleFavoriteProject();
  const { data: userFavorites } = useUserFavoriteProjects(isLoggedIn);
  const actualFavoriteIds = new Set(Array.isArray(userFavorites) ? userFavorites : []);

  // Helpers
  const formatAmount = (amount: number): string => amount.toLocaleString('ko-KR');
  const calculatePercentage = (current: number, target: number): number => Math.round((current / target) * 100);

  const handleFavoriteClick = async (e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleCategoryReset = () => {
    setSelectedCategory('전체');
    setSearchKeyword('');
  };

  const displayProjects = projects?.content || [];

  return (
    <div className="bg-stone-50">
      {/* ========== Hero Section ========== */}
      <section className="relative min-h-[280px] md:min-h-[320px] bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

        <div className="relative h-full min-h-[280px] md:min-h-[320px] flex flex-col items-center justify-center text-center px-4 py-10">
          <p className="text-amber-400 uppercase tracking-[0.3em] text-xs md:text-sm mb-6">
            Explore & Support
          </p>

          <h1 className="text-3xl md:text-5xl text-white font-light leading-tight mb-6 max-w-3xl">
            마음을 움직이는<br />
            <span className="text-amber-400 font-medium">프로젝트</span>를 만나보세요
          </h1>

          {/* 검색창 */}
          <div className={`w-full max-w-xl transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                placeholder="검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-stone-400 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-base"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ========== 실시간 기부 마퀴 ========== */}
      {recentDonations && recentDonations.length > 0 && (
        <section className="py-3 bg-stone-800 text-white overflow-hidden">
          <div className="relative">
            <div className="flex items-center">
              {/* 왼쪽 라벨 */}
              <div className="flex items-center gap-2 shrink-0 bg-stone-800 z-10 pr-4 pl-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-stone-300 text-sm font-medium">실시간 기부</span>
              </div>

              {/* 마퀴 애니메이션 */}
              <div className="overflow-hidden flex-1">
                <div className="animate-marquee flex gap-8 whitespace-nowrap">
                  {/* 원본 */}
                  {recentDonations.map((donation, idx) => (
                    <span key={`a-${idx}`} className="text-stone-400 text-sm">
                      <span className="text-white font-medium">{donation.donorName}</span>님이{' '}
                      <span className="text-amber-400 font-medium">{formatAmount(donation.amount)}원</span>을 기부했습니다
                    </span>
                  ))}
                  {/* 복제 (무한 루프용) */}
                  {recentDonations.map((donation, idx) => (
                    <span key={`b-${idx}`} className="text-stone-400 text-sm">
                      <span className="text-white font-medium">{donation.donorName}</span>님이{' '}
                      <span className="text-amber-400 font-medium">{formatAmount(donation.amount)}원</span>을 기부했습니다
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== Category Filter ========== */}
      <section className="py-8 px-4 bg-stone-50 border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-stone-500 text-sm mb-5">관심 분야를 선택해보세요</p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm ${
                    isSelected
                      ? 'bg-amber-500 text-stone-900 shadow-md'
                      : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-600'} />
                  <span className="font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== 탭 & 정렬 ========== */}
      <section className="py-4 px-4 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 탭 */}
          <div className="flex bg-stone-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <TrendingUp size={16} />
              진행 중
            </button>
            <button
              onClick={() => setActiveTab('settlement')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'settlement'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Clock size={16} />
              결산 중
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'closed'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <CheckCircle2 size={16} />
              종료
            </button>
          </div>

          {/* 정렬 */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
          >
            <option value="latest">최신순</option>
            <option value="deadline">마감임박순</option>
            <option value="mostDonated">후원 많은 순</option>
            <option value="leastDonated">후원 적은 순</option>
            <option value="mostFavorited">관심 많은 순</option>
          </select>
        </div>
      </section>

      {/* ========== Project Grid ========== */}
      <section className="py-10 md:py-14 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 필터 결과 */}
          {(selectedCategory !== '전체' || searchKeyword.trim()) && !isLoading && (
            <div className="mb-8 flex items-center gap-3 flex-wrap">
              <span className="text-stone-600">
                {selectedCategory !== '전체' && (
                  <span className="font-medium text-stone-800">{selectedCategory}</span>
                )}
                {searchKeyword.trim() && (
                  <>
                    {selectedCategory !== '전체' && ' · '}
                    "<span className="font-medium text-stone-800">{searchKeyword}</span>"
                  </>
                )}
                {' '}검색 결과
              </span>
              <span className="text-amber-600 font-medium">{projects?.totalElements || 0}개</span>
              <button
                onClick={handleCategoryReset}
                className="ml-auto text-stone-400 hover:text-stone-600 text-sm flex items-center gap-1"
              >
                <X size={14} />
                필터 초기화
              </button>
            </div>
          )}

          {/* 로딩 */}
          {isLoading ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12">
              <LoadingSpinner size="lg" message="프로젝트를 불러오는 중..." />
            </div>
          ) : isError ? (
            /* 에러 상태 */
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-stone-600 mb-4">
                {(error as any)?.response?.data?.message || '프로젝트를 불러오는데 실패했습니다.'}
              </p>
              <button
                onClick={() => refetch()}
                className="bg-amber-500 text-stone-900 px-6 py-3 font-medium hover:bg-amber-400 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : displayProjects.length === 0 ? (
            /* 결과 없음 */
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-stone-100 rounded-full flex items-center justify-center">
                <FileText className="text-stone-300" size={48} />
              </div>
              <h3 className="text-xl font-medium text-stone-800 mb-2">
                {searchKeyword.trim() ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
              </h3>
              <p className="text-stone-500 mb-8">
                다른 카테고리나 검색어로 찾아보세요.
              </p>
              <button
                onClick={handleCategoryReset}
                className="bg-amber-500 text-stone-900 px-8 py-4 font-medium hover:bg-amber-400 transition-colors"
              >
                전체 프로젝트 보기
              </button>
            </div>
          ) : (
            <>
              {/* 프로젝트 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProjects.map((project) => {
                  const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                  const isFavorite = isLoggedIn ? actualFavoriteIds.has(project.id) : false;
                  const categoryKo = getCategoryLabel(project.category);

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group relative"
                    >
                      {/* 하트 버튼 */}
                      <button
                        onClick={(e) => handleFavoriteClick(e, project.id)}
                        className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow hover:scale-110 transition-transform"
                      >
                        <Heart
                          size={18}
                          className={isFavorite ? 'text-amber-500' : 'text-stone-400'}
                          fill={isFavorite ? 'currentColor' : 'none'}
                        />
                      </button>

                      <Link to={`/projects/${project.id}`} className="block">
                        {/* 이미지 */}
                        <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden relative">
                          {project.image ? (
                            <img
                              src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.image}`}
                              alt={project.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <Heart size={56} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50" />
                          )}
                        </div>

                        {/* 내용 */}
                        <div className="p-5">
                          <span className="text-xs text-amber-600 font-medium">{categoryKo}</span>
                          <h4 className="text-base font-medium text-stone-800 mt-1 mb-4 line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug min-h-[2.5rem]">
                            {project.title}
                          </h4>

                          {/* 프로그레스 */}
                          <div className="mb-4">
                            <div className="flex items-end gap-2 mb-2">
                              <span className="text-2xl text-amber-600 font-light">{progress}%</span>
                              <span className="text-stone-400 text-xs pb-0.5">달성</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* 통계 */}
                          <div className="flex items-center justify-between text-sm text-stone-500">
                            <span className="font-medium text-stone-700">{formatAmount(project.currentAmount)}원</span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {project.donors}
                              </span>
                              <span className="text-amber-600 font-medium">D-{project.dday}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* 페이지네이션 */}
              {projects && projects.totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={projects.totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-12"
                />
              )}
            </>
          )}
        </div>
      </section>

    </div>
  );
};

export default ProjectListPage;
