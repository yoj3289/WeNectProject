import React, { useState } from 'react';
import { Search, Heart, FileText, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectListPageProps {
  projects: Project[];
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onProjectSelect: (project: Project) => void;
  onToggleFavorite: (projectId: number) => void;
  onNavigateToLogin: () => void;
}

const ProjectListPage: React.FC<ProjectListPageProps> = ({
  projects,
  isLoggedIn,
  favoriteProjectIds,
  onProjectSelect,
  onToggleFavorite,
  onNavigateToLogin
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortOption, setSortOption] = useState<string>('최신순');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

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

  // 필터링 및 정렬 로직
  const getFilteredAndSortedProjects = (): Project[] => {
    let result = [...projects];

    // 승인된 프로젝트만 표시
    result = result.filter(p => p.status === 'approved');

    // 카테고리 필터링
    if (selectedCategory !== '전체') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 키워드 검색 (제목, 설명, 기관명으로 검색)
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword) ||
        p.organization.toLowerCase().includes(keyword)
      );
    }

    // 정렬
    switch (sortOption) {
      case '최신순':
        result.sort((a, b) => b.id - a.id);
        break;
      case '마감임박순':
        result.sort((a, b) => a.dday - b.dday);
        break;
      case '모금률순':
        result.sort((a, b) => {
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          return progressB - progressA;
        });
        break;
    }

    return result;
  };

  const displayProjects = getFilteredAndSortedProjects();

  // Handlers
  const handleFavoriteClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      onNavigateToLogin();
    } else {
      onToggleFavorite(projectId);
    }
  };

  const handleProjectClick = (project: Project) => {
    onProjectSelect(project);
  };

  const handleCategoryReset = () => {
    setSelectedCategory('전체');
    setSearchKeyword('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <h1 className="text-5xl font-bold mb-10">프로젝트 둘러보기</h1>

        <div className="flex gap-4 mb-8">
          {/* 검색창 */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>

          {/* 카테고리 필터 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
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
            className="px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
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
          <div className="grid grid-cols-4 gap-6">
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
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Heart
                      size={24}
                      className={isFavorite ? 'text-red-500' : 'text-gray-400'}
                      fill={isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>

                  <div
                    className="cursor-pointer"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className={`h-48 bg-gradient-to-br ${categoryInfo.bgColor} flex items-center justify-center text-gray-400`}>
                      {categoryInfo.icon}
                    </div>
                    <div className="p-5">
                      <div className="text-sm text-red-500 font-semibold mb-2">{project.category}</div>
                      <h4 className="text-lg font-bold mb-3 line-clamp-2">{project.title}</h4>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
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
  );
};

export default ProjectListPage;
