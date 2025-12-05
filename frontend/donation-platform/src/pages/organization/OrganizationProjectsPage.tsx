import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, Heart, Baby, Dog, UserCircle, TreePine, GraduationCap, Loader2, AlertCircle, Sparkles, X, ArrowLeft, Building2, FolderOpen, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganizations, useOrganizationProjects } from '../../hooks/useOrganizations';
import { useToggleFavoriteProject, useUserFavoriteProjects } from '../../hooks/useProjects';
import type { Project } from '../../types';
import Pagination from '../../components/common/Pagination';

interface OrganizationProjectsPageProps {
  isLoggedIn: boolean;
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

const OrganizationProjectsPage: React.FC<OrganizationProjectsPageProps> = ({
  isLoggedIn,
  onProjectSelect,
  onNavigateToLogin
}) => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const organizationId = orgId ? parseInt(orgId) : 0;

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const pageSize = 12;

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 필터/정렬 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortOption]);

  // API 호출 - 기관 정보
  const { data: organizationsData } = useOrganizations({
    page: 0,
    size: 1000, // 모든 기관 조회하여 현재 기관 찾기
  });

  const currentOrganization = organizationsData?.content?.find(org => org.id === organizationId);

  // API 호출 - 기관 프로젝트 목록
  const { data: projects, isLoading, isError, error, refetch } = useOrganizationProjects(organizationId, {
    category: selectedCategory === '전체' ? undefined : selectedCategory,
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1,
    size: pageSize,
  });

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

  // 에러 상태
  if (isError) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
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
      </div>
    );
  }

  const displayProjects = projects?.content || [];

  return (
    <div className="bg-stone-50">
      {/* ========== 기관 정보 헤더 ========== */}
      <section className="bg-stone-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* 뒤로 가기 버튼 */}
          <button
            onClick={() => navigate('/organizations')}
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>기관 목록으로 돌아가기</span>
          </button>

          {currentOrganization ? (
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* 기관 로고 */}
              <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentOrganization.logoUrl ? (
                  <img
                    src={currentOrganization.logoUrl}
                    alt={currentOrganization.orgName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 size={48} className="text-white/50" />
                )}
              </div>

              {/* 기관 정보 */}
              <div className="flex-1">
                <h1 className="text-3xl font-medium mb-2">{currentOrganization.orgName}</h1>
                {currentOrganization.representative && (
                  <p className="text-amber-400 mb-3">대표: {currentOrganization.representative}</p>
                )}
                {currentOrganization.description && (
                  <p className="text-stone-300 mb-4">{currentOrganization.description}</p>
                )}

                {/* 통계 */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={18} className="text-amber-400" />
                    <span className="text-sm">총 프로젝트 <strong>{currentOrganization.totalProjects}</strong>개</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-amber-400" />
                    <span className="text-sm">진행 중 <strong>{currentOrganization.activeProjects}</strong>개</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-amber-400" />
                    <span className="text-sm">총 모금액 <strong>{formatAmount(currentOrganization.totalFunded)}</strong>원</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Loader2 className="animate-spin" size={24} />
              <span>기관 정보를 불러오는 중...</span>
            </div>
          )}
        </div>
      </section>

      {/* ========== 메인 컨텐츠 ========== */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ========== 검색 및 필터 ========== */}
        <div className="mb-8">
          {/* 검색창 */}
          <div className="mb-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                placeholder="프로젝트 제목으로 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white text-stone-700 border border-stone-300 hover:border-amber-400'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* 정렬 옵션 */}
          <div className="flex items-center justify-between">
            <p className="text-stone-600">
              총 <strong>{projects?.totalElements || 0}</strong>개의 프로젝트
            </p>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-stone-300 bg-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감임박순</option>
              <option value="mostDonated">모금액 많은 순</option>
            </select>
          </div>
        </div>

        {/* ========== 프로젝트 카드 그리드 ========== */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
            <p className="text-stone-500">프로젝트를 불러오는 중...</p>
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-200 rounded-full flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500 mb-2">프로젝트가 없습니다.</p>
            <p className="text-stone-400 text-sm">다른 필터를 선택해보세요.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProjects.map((project: Project) => {
                const percentage = calculatePercentage(project.currentAmount, project.targetAmount);
                const isFavorite = actualFavoriteIds.has(project.id);

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="group bg-white border border-stone-200 hover:border-amber-500 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* 프로젝트 이미지 */}
                    <div className="aspect-video bg-stone-100 relative overflow-hidden">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen size={64} className="text-stone-300" />
                        </div>
                      )}

                      {/* 관심 버튼 */}
                      <button
                        onClick={(e) => handleFavoriteClick(e, project.id)}
                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md"
                      >
                        <Heart
                          size={18}
                          className={isFavorite ? 'fill-red-500 text-red-500' : 'text-stone-600'}
                        />
                      </button>
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="p-6">
                      {/* 카테고리 */}
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full mb-3">
                        {project.category}
                      </span>

                      {/* 제목 */}
                      <h3 className="text-lg font-medium text-stone-900 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
                        {project.title}
                      </h3>

                      {/* 진행률 바 */}
                      <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-2xl font-bold text-stone-900">
                            {percentage}%
                          </span>
                          <span className="text-sm text-stone-500">
                            {project.dday > 0 ? `D-${project.dday}` : '종료'}
                          </span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* 통계 */}
                      <div className="flex items-center justify-between text-sm text-stone-600 pt-4 border-t border-stone-200">
                        <span>{formatAmount(project.currentAmount)}원</span>
                        <span>{project.donors}명 참여</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ========== 페이지네이션 ========== */}
            {projects && projects.totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={projects.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationProjectsPage;
