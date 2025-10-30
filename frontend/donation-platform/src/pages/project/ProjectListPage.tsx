import React, { useState } from 'react';
import { Search, Heart, FileText, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Loader2, AlertCircle } from 'lucide-react';
import { useProjects, useToggleFavoriteProject } from '../../hooks/useProjects';
import type { Project } from '../../types';

interface ProjectListPageProps {
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onProjectSelect: (project: Project) => void;
  onNavigateToLogin: () => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({
  isLoggedIn,
  favoriteProjectIds,
  onProjectSelect,
  onNavigateToLogin
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortOption, setSortOption] = useState<string>('최신순');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // API: 프로젝트 목록 조회
  const { data: projects, isLoading, isError, error, refetch } = useProjects({
    status: 'approved',
    category: selectedCategory === '전체' ? undefined : selectedCategory,
    search: searchKeyword.trim() || undefined,
    sortBy: sortOption === '최신순' ? 'latest' : sortOption === '마감임박순' ? 'deadline' : 'fundingRate',
  });

  // API: 관심 프로젝트 토글
  const toggleFavoriteMutation = useToggleFavoriteProject();

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
      '아동복지': { icon: <Baby size={80} />, bgColor: 'from-pink-100 to-rose-100' },
      '동물보호': { icon: <Dog size={80} />, bgColor: 'from-cyan-100 to-teal-100' },
      '노인복지': { icon: <UserCircle size={80} />, bgColor: 'from-emerald-100 to-green-100' },
      '환경보호': { icon: <TreePine size={80} />, bgColor: 'from-red-100 to-orange-100' },
      '교육': { icon: <GraduationCap size={80} />, bgColor: 'from-purple-100 to-indigo-100' },
      '장애인복지': { icon: <Accessibility size={80} />, bgColor: 'from-rose-100 to-pink-100' }
    };
    return iconMap[category] || { icon: <Heart size={80} />, bgColor: 'from-gray-100 to-gray-200' };
  };

  // Handlers
  const handleFavoriteClick = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
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

  const handleProjectClick = (project: Project) => {
    onProjectSelect(project);
  };

  const handleCategoryReset = () => {
    setSelectedCategory('전체');
    setSearchKeyword('');
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {(error as any)?.response?.data?.message || '프로젝트를 불러오는데 실패했습니다.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const displayProjects = projects?.content || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 lg:mb-10">프로젝트 둘러보기</h1>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          {/* 검색창 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm md:text-base"
            />
          </div>

          {/* 카테고리 필터 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 md:px-6 py-3 md:py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer text-sm md:text-base"
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
            className="px-4 md:px-6 py-3 md:py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer text-sm md:text-base"
          >
            <option>최신순</option>
            <option>마감임박순</option>
            <option>모금률순</option>
          </select>
        </div>

        {/* 필터 결과 표시 */}
        {(selectedCategory !== '전체' || searchKeyword.trim()) && (
          <div className="mb-6">
            <p className="text-gray-600">
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
              <span className="font-bold text-red-500 ml-2">{displayProjects.length}개</span>
            </p>
          </div>
        )}

        {/* 필터 결과 없을 때 */}
        {displayProjects.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg mb-4">
              {searchKeyword.trim()
                ? '검색 결과가 없습니다.'
                : '해당 카테고리에 프로젝트가 없습니다.'
              }
            </p>
            <button
              onClick={handleCategoryReset}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
            >
              전체 프로젝트 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {displayProjects.map(project => {
              const progress = calculatePercentage(project.currentAmount, project.targetAmount);
              const isFavorite = favoriteProjectIds.has(project.id);
              const categoryInfo = getCategoryIcon(project.category);

              return (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white relative"
                >
                  {/* 관심 프로젝트 하트 버튼 */}
                  <button
                    onClick={(e) => handleFavoriteClick(e, project.id)}
                    className="absolute top-3 right-3 md:top-4 md:right-4 z-10 p-1.5 md:p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Heart
                      size={20}
                      className={`md:w-6 md:h-6 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                      fill={isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>

                  <div
                    className="cursor-pointer"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className={`h-40 md:h-48 bg-gradient-to-br ${categoryInfo.bgColor} flex items-center justify-center text-gray-400`}>
                      {categoryInfo.icon}
                    </div>
                    <div className="p-4 md:p-5">
                      <div className="text-xs md:text-sm text-red-500 font-semibold mb-2">{project.category}</div>
                      <h4 className="text-base md:text-lg font-bold mb-3 line-clamp-2">{project.title}</h4>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs md:text-sm mb-2">
                          <span className="font-bold text-red-500">{progress}%</span>
                          <span className="text-gray-600">D-{project.dday}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs md:text-sm text-gray-600">
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
  );
};

export default ProjectListPage;
