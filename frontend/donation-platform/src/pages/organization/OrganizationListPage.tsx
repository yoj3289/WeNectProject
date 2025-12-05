import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, AlertCircle, Building2, Users, TrendingUp, Clock, ChevronDown, X, Heart, FolderOpen } from 'lucide-react';
import { useOrganizations } from '../../hooks/useOrganizations';
import Pagination from '../../components/common/Pagination';
import type { OrganizationListResponse } from '../../api/organization';

const OrganizationListPage: React.FC = () => {
  // State
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

  // 정렬 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption]);

  // API 호출
  const { data: organizations, isLoading, isError, error, refetch } = useOrganizations({
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1,
    size: pageSize,
  });

  // Helpers
  const formatAmount = (amount: number): string => amount.toLocaleString('ko-KR');

  // 에러 상태
  if (isError) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-stone-600 mb-4">
            {(error as any)?.response?.data?.message || '기관 목록을 불러오는데 실패했습니다.'}
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

  const displayOrganizations = organizations?.content || [];

  return (
    <div className="bg-stone-50">
      {/* ========== Hero Section ========== */}
      <section className="relative min-h-[400px] md:min-h-[480px] bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

        <div className="relative h-full min-h-[400px] md:min-h-[480px] flex flex-col items-center justify-center text-center px-4 py-16">
          <p className="text-amber-400 uppercase tracking-[0.3em] text-xs md:text-sm mb-6">
            Verified Organizations
          </p>

          <h1 className="text-3xl md:text-5xl text-white font-light leading-tight mb-6 max-w-3xl">
            신뢰할 수 있는<br />
            <span className="text-amber-400 font-medium">기관</span>을 만나보세요
          </h1>

          {/* 검색창 */}
          <div className={`w-full max-w-xl transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                placeholder="기관명으로 검색..."
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

          {/* 스크롤 인디케이터 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 flex flex-col items-center gap-1 animate-bounce">
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </section>

      {/* ========== 메인 컨텐츠 ========== */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ========== 정렬 옵션 ========== */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-stone-600">
            <Building2 size={20} className="text-amber-600" />
            <span className="font-medium">
              총 {organizations?.totalElements || 0}개의 기관
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">정렬:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-stone-300 bg-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            >
              <option value="latest">최신순</option>
              <option value="mostProjects">프로젝트 많은 순</option>
              <option value="mostSettlement">결산 많은 순</option>
            </select>
          </div>
        </div>

        {/* ========== 기관 카드 그리드 ========== */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
            <p className="text-stone-500">기관 목록을 불러오는 중...</p>
          </div>
        ) : displayOrganizations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-200 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500 mb-2">검색 결과가 없습니다.</p>
            <p className="text-stone-400 text-sm">다른 검색어를 입력해보세요.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayOrganizations.map((org: OrganizationListResponse) => (
                <Link
                  key={org.id}
                  to={`/organizations/${org.id}/projects`}
                  className="group bg-white border border-stone-200 hover:border-amber-500 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* 기관 로고 */}
                  <div className="aspect-video bg-stone-100 relative overflow-hidden">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.orgName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={64} className="text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* 기관 정보 */}
                  <div className="p-6">
                    {/* 기관명 */}
                    <h3 className="text-xl font-medium text-stone-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {org.orgName}
                    </h3>

                    {/* 대표자 */}
                    {org.representative && (
                      <p className="text-sm text-stone-500 mb-4">
                        대표: {org.representative}
                      </p>
                    )}

                    {/* 소개 */}
                    {org.description && (
                      <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                        {org.description}
                      </p>
                    )}

                    {/* 통계 */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FolderOpen size={14} className="text-amber-600" />
                          <p className="text-xs text-stone-500">총 프로젝트</p>
                        </div>
                        <p className="text-lg font-semibold text-stone-900">{org.totalProjects}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Heart size={14} className="text-amber-600" />
                          <p className="text-xs text-stone-500">진행 중</p>
                        </div>
                        <p className="text-lg font-semibold text-amber-600">{org.activeProjects}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp size={14} className="text-amber-600" />
                          <p className="text-xs text-stone-500">결산 중</p>
                        </div>
                        <p className="text-lg font-semibold text-stone-900">
                          {org.settlementProjects}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ========== 페이지네이션 ========== */}
            {organizations && organizations.totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={organizations.totalPages}
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

export default OrganizationListPage;
