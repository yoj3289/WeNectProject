import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, BarChart3, CheckCircle, Clock, Wallet, Loader2, AlertCircle, Edit, Eye, Plus, Target, Users, LayoutGrid, List, User } from 'lucide-react';
import { useOrganizationStats, useOrganizationProjects } from '../../hooks/useOrganization';
import { useUpdateProject } from '../../hooks/useProjects';
import { getCategoryLabel } from '../../types';
import type { Project } from '../../types';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SettlementRequestModal } from '../../components/settlement/SettlementRequestModal';
import EditProjectModal from '../../components/project/EditProjectModal';
import { getProjectStatusLabel, getProjectStatusBadgeStyle, canEditProject } from '../../utils/projectStatus';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuthStore } from '../../stores/authStore';

const OrganizationDashboardPage: React.FC = () => {
  // Auth State
  const { user } = useAuthStore();

  // State
  const [statusFilter, setStatusFilter] = useState<'active' | 'settlement' | ''>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const updateProjectMutation = useUpdateProject();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortOption]);

  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useOrganizationStats();

  const {
    data: projects,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    refetch
  } = useOrganizationProjects({
    status: statusFilter || undefined,
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1,
    size: pageSize,
  });

  const formatAmount = (amount: number): string => {
    return Math.floor(amount).toLocaleString('ko-KR');
  };

  const calculatePercentage = (current: number, target: number): number => {
    return Math.round((current / target) * 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { icon: React.ReactNode }> = {
      'active': { icon: <Clock size={14} /> },
      'pending': { icon: <Clock size={14} /> },
      'approved': { icon: <CheckCircle size={14} /> },
      'completed': { icon: <CheckCircle size={14} /> },
      'settlement': { icon: <Wallet size={14} /> },
      'closed': { icon: <CheckCircle size={14} /> },
      'cancelled': { icon: <AlertCircle size={14} /> },
      'rejected': { icon: <AlertCircle size={14} /> },
    };
    const icon = statusMap[status.toLowerCase()]?.icon || <Clock size={14} />;
    const label = getProjectStatusLabel(status);
    const color = getProjectStatusBadgeStyle(status);

    return { label, color, icon };
  };

  const displayProjects = projects?.content || [];

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-3">Dashboard</p>
              <h1 className="text-2xl md:text-3xl text-white font-light">
                프로젝트 <span className="font-medium">관리</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/organization/profile"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline">프로필 관리</span>
                <span className="sm:hidden">프로필</span>
              </Link>
              <Link
                to="/organization/statistics"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                <BarChart3 size={18} />
                <span className="hidden sm:inline">프로젝트 통계</span>
                <span className="sm:hidden">통계</span>
              </Link>
              <Link
                to="/projects/create"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">새 프로젝트 등록</span>
                <span className="sm:hidden">등록</span>
              </Link>
            </div>
          </div>

          {/* 통계 카드 */}
          {isLoadingStats ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mt-6 sm:mt-8 border border-white/20">
              <LoadingSpinner size="md" message="통계를 불러오는 중..." />
            </div>
          ) : isErrorStats ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-6 sm:mt-8">
              <p className="text-red-200 text-sm">통계를 불러오는데 실패했습니다.</p>
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-6 sm:mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <BarChart3 className="text-amber-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm text-white/80">전체</span>
                </div>
                <p className="text-lg sm:text-2xl font-light text-white">{stats.totalProjects}개</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Clock className="text-blue-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm text-white/80">진행 중</span>
                </div>
                <p className="text-lg sm:text-2xl font-light text-white">{stats.activeProjects}개</p>
                <p className="text-[10px] sm:text-xs text-white/60 mt-1 hidden sm:block">{formatAmount(stats.activeFunding)}원 모금 중</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Wallet className="text-orange-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm text-white/80">결산 중</span>
                </div>
                <p className="text-lg sm:text-2xl font-light text-white">{stats.settlementProjects}개</p>
                <p className="text-[10px] sm:text-xs text-white/60 mt-1 hidden sm:block">저금통 {formatAmount(stats.totalWalletBalance)}원</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <CheckCircle className="text-green-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm text-white/80">종료</span>
                </div>
                <p className="text-lg sm:text-2xl font-light text-white">{stats.closedProjects}개</p>
              </div>

              <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-amber-500/30 col-span-2 sm:col-span-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <TrendingUp className="text-amber-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm text-white/80">누적 모금</span>
                </div>
                <p className="text-lg sm:text-2xl font-light text-white break-all">{formatAmount(stats.totalFunding)}원</p>
              </div>
            </div>
          )}

          {/* 프로필 미완성 알림 */}
          {user?.profileIncomplete && (
            <div className="mt-6 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-white">기관 프로필을 완성해주세요</h3>
                <p className="text-sm text-white/80 mt-1">
                  기관 로고 이미지를 등록하면 후원자들에게 더 신뢰감을 줄 수 있습니다.
                </p>
              </div>
              <Link
                to="/organization/profile"
                className="px-4 py-2 bg-amber-500 text-stone-900 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors whitespace-nowrap"
              >
                프로필 수정
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Filter & List Section */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 필터 */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="프로젝트명 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
              />
              {isLoadingProjects && searchKeyword !== debouncedSearchKeyword && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" size={18} />
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'settlement' | '')}
              className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
            >
              <option value="">전체 상태</option>
              <option value="pending">심사중</option>
              <option value="active">진행중</option>
              <option value="completed">완료</option>
              <option value="settlement">결산중</option>
              <option value="closed">종료</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감임박순</option>
              <option value="fundingRate">모금률순</option>
            </select>

            {/* 뷰 모드 토글 */}
            <div className="flex border border-stone-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                title="카드 보기"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                title="목록 보기"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {isLoadingProjects ? (
          <div className="bg-white rounded-2xl shadow-md p-12">
            <LoadingSpinner size="lg" message="프로젝트 목록을 불러오는 중..." />
          </div>
        ) : isErrorProjects ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
            <p className="text-red-700 font-medium">프로젝트 목록을 불러오는데 실패했습니다.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <Target className="text-stone-300" size={32} />
            </div>
            <p className="text-stone-600 font-medium mb-2">
              {searchKeyword || statusFilter ? '검색 결과가 없습니다.' : '등록된 프로젝트가 없습니다.'}
            </p>
            <p className="text-stone-500 text-sm mb-6">첫 번째 프로젝트를 등록해보세요!</p>
            <Link
              to="/projects/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 transition-colors"
            >
              <Plus size={18} />
              프로젝트 등록하기
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          /* 카드 뷰 (Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayProjects.map((project: Project) => {
              const progress = calculatePercentage(project.currentAmount, project.targetAmount);
              const statusInfo = getStatusBadge(project.status || 'pending');
              const categoryKo = getCategoryLabel(project.category);

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="h-40 bg-gradient-to-br from-amber-200 to-orange-200 relative overflow-hidden">
                    {project.image ? (
                      <img
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.image}`}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Target size={48} className="text-white/40" />
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                        {categoryKo}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-stone-800 mb-3 line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {project.title}
                    </h3>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-amber-600">{progress}%</span>
                        <span className="text-stone-400">D-{project.dday}</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500 mb-4">
                      <span>현재: <strong className="text-stone-800">{formatAmount(project.currentAmount)}원</strong></span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {project.donors}명
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {canEditProject(project.status) && (
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowEditModal(true);
                          }}
                          className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-sm text-stone-600"
                        >
                          <Edit size={14} />
                          수정
                        </button>
                      )}
                      {(project.status?.toLowerCase() === 'settlement' || project.status?.toLowerCase() === 'closed') && (
                        <Link
                          to={`/organization/projects/${project.id}/piggybank`}
                          className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm"
                        >
                          <Wallet size={14} />
                          저금통
                        </Link>
                      )}
                      {project.status?.toLowerCase() === 'completed' && (
                        <>
                          {(!project.settlementStatus || project.settlementStatus === 'REJECTED') && (
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowSettlementModal(true);
                              }}
                              className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm"
                            >
                              <Wallet size={14} />
                              정산 요청
                            </button>
                          )}
                          {project.settlementStatus === 'PENDING' && (
                            <div className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl text-sm border border-yellow-200">
                              <Clock size={14} />
                              정산 대기
                            </div>
                          )}
                          {project.settlementStatus === 'APPROVED' && (
                            <Link
                              to={`/organization/projects/${project.id}/piggybank`}
                              className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm"
                            >
                              <Wallet size={14} />
                              저금통
                            </Link>
                          )}
                        </>
                      )}
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 bg-amber-500 text-stone-900 rounded-xl hover:bg-amber-400 transition-colors text-sm font-medium"
                      >
                        <Eye size={14} />
                        상세
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 리스트 뷰 (Table) */
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* 테이블 헤더 - 데스크톱만 표시 */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
              <div className="col-span-4">프로젝트</div>
              <div className="col-span-2 text-center">상태</div>
              <div className="col-span-2 text-right">모금현황</div>
              <div className="col-span-1 text-center">D-Day</div>
              <div className="col-span-1 text-center">참여</div>
              <div className="col-span-2 text-center">관리</div>
            </div>

            {/* 테이블 바디 */}
            <div className="divide-y divide-stone-100">
              {displayProjects.map((project: Project) => {
                const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                const statusInfo = getStatusBadge(project.status || 'pending');
                const categoryKo = getCategoryLabel(project.category);

                return (
                  <div
                    key={project.id}
                    className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-4 sm:px-6 py-4 hover:bg-stone-50 transition-colors lg:items-center"
                  >
                    {/* 프로젝트 정보 */}
                    <div className="lg:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-amber-200 to-orange-200 flex-shrink-0 overflow-hidden">
                        {project.image ? (
                          <img
                            src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.image}`}
                            alt={project.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Target size={16} className="text-white/60 sm:w-5 sm:h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] sm:text-xs font-medium">
                            {categoryKo}
                          </span>
                          {/* 모바일에서만 상태 표시 */}
                          <span className={`lg:hidden px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-stone-800 truncate">
                          {project.title}
                        </h3>
                      </div>
                    </div>

                    {/* 상태 - 데스크톱에서만 */}
                    <div className="hidden lg:flex lg:col-span-2 justify-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* 모금현황 + D-Day + 참여자 - 모바일에서 한 줄로 */}
                    <div className="lg:hidden flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="font-medium text-stone-800">{formatAmount(project.currentAmount)}원</span>
                        <span className="text-amber-600 ml-1 text-[10px] sm:text-xs">({progress}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500">D-{project.dday}</span>
                        <span className="text-stone-400">|</span>
                        <span className="text-stone-600 flex items-center gap-0.5">
                          <Users size={12} className="text-stone-400" />
                          {project.donors}
                        </span>
                      </div>
                    </div>

                    {/* 모금현황 - 데스크톱 */}
                    <div className="hidden lg:block lg:col-span-2 text-right">
                      <div className="text-sm font-medium text-stone-800">{formatAmount(project.currentAmount)}원</div>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <div className="w-16 bg-stone-100 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-amber-600 font-medium">{progress}%</span>
                      </div>
                    </div>

                    {/* D-Day - 데스크톱 */}
                    <div className="hidden lg:block lg:col-span-1 text-center">
                      <span className="text-sm text-stone-500">D-{project.dday}</span>
                    </div>

                    {/* 참여자 - 데스크톱 */}
                    <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                      <span className="text-sm text-stone-600 flex items-center gap-1">
                        <Users size={14} className="text-stone-400" />
                        {project.donors}
                      </span>
                    </div>

                    {/* 관리 버튼 */}
                    <div className="lg:col-span-2 flex items-center justify-end lg:justify-center gap-1">
                      {canEditProject(project.status) && (
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {(project.status?.toLowerCase() === 'settlement' || project.status?.toLowerCase() === 'closed') && (
                        <Link
                          to={`/organization/projects/${project.id}/piggybank`}
                          className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="저금통"
                        >
                          <Wallet size={16} />
                        </Link>
                      )}
                      {project.status?.toLowerCase() === 'completed' && (
                        <>
                          {(!project.settlementStatus || project.settlementStatus === 'REJECTED') && (
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowSettlementModal(true);
                              }}
                              className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="정산 요청"
                            >
                              <Wallet size={16} />
                            </button>
                          )}
                          {project.settlementStatus === 'PENDING' && (
                            <span className="p-2 text-yellow-600" title="정산 대기 중">
                              <Clock size={16} />
                            </span>
                          )}
                          {project.settlementStatus === 'APPROVED' && (
                            <Link
                              to={`/organization/projects/${project.id}/piggybank`}
                              className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="저금통"
                            >
                              <Wallet size={16} />
                            </Link>
                          )}
                        </>
                      )}
                      <Link
                        to={`/projects/${project.id}`}
                        className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="상세보기"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {projects && projects.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={projects.totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mt-8"
          />
        )}

        {showSettlementModal && selectedProject && (
          <SettlementRequestModal
            projectId={selectedProject.id}
            projectTitle={selectedProject.title}
            totalAmount={selectedProject.currentAmount}
            onClose={() => {
              setShowSettlementModal(false);
              setSelectedProject(null);
            }}
            onSuccess={() => {
              refetch();
            }}
          />
        )}

        {showEditModal && selectedProject && (
          <EditProjectModal
            project={selectedProject}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProject(null);
            }}
            onSubmit={async (title, description, budgetPlan, budgetPlanChangeReason) => {
              await updateProjectMutation.mutateAsync({
                projectId: selectedProject.id,
                title,
                description,
                budgetPlan,
                budgetPlanChangeReason,
              });
              refetch();
            }}
          />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          isDanger={confirmModal.isDanger}
        />
      </section>
    </div>
  );
};

export default OrganizationDashboardPage;
