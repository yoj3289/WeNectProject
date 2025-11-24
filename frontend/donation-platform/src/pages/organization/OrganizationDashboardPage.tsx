import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, BarChart3, CheckCircle, Clock, Wallet, Loader2, AlertCircle, Edit, Eye } from 'lucide-react';
import { useOrganizationStats, useOrganizationProjects } from '../../hooks/useOrganization';
import { useUpdateProject } from '../../hooks/useProjects';
import { getCategoryLabel } from '../../types';
import type { Project } from '../../types';
import Pagination from '../../components/common/Pagination';
import { SettlementRequestModal } from '../../components/settlement/SettlementRequestModal';
import EditProjectModal from '../../components/project/EditProjectModal';
import * as settlementsApi from '../../api/settlements';
import { getProjectStatusLabel, getProjectStatusBadgeStyle, canEditProject } from '../../utils/projectStatus';

/**
 * 기관 대시보드 페이지
 * - 기관이 등록한 프로젝트 관리
 * - 통계 요약, 프로젝트 목록, 검색/필터
 */
const OrganizationDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // API: 프로젝트 수정
  const updateProjectMutation = useUpdateProject();

  // 테스트용: 정산 승인
  const handleTestApprove = async () => {
    const id = prompt('승인할 정산 ID를 입력하세요:');
    if (!id) return;

    try {
      await settlementsApi.approveSettlement(Number(id), { adminMemo: '테스트 승인' });
      alert('✅ 정산 승인 완료!');
      refetch();
    } catch (error: any) {
      alert('❌ 승인 실패: ' + error.message);
    }
  };

  // 테스트용: 정산 반려
  const handleTestReject = async () => {
    const id = prompt('반려할 정산 ID를 입력하세요:');
    if (!id) return;

    const reason = prompt('반려 사유를 입력하세요:', '서류 부족');
    if (!reason) return;

    try {
      await settlementsApi.rejectSettlement(Number(id), { rejectionReason: reason });
      alert('✅ 정산 반려 완료!');
      refetch();
    } catch (error: any) {
      alert('❌ 반려 실패: ' + error.message);
    }
  };

  // 테스트용: 정산 목록 조회
  const handleTestList = async () => {
    try {
      const settlements = await settlementsApi.getSettlementsByStatus('PENDING');
      console.log('📋 대기 중인 정산 목록:', settlements);
      alert(`대기 중인 정산 ${settlements.length}개 (콘솔 확인)`);
    } catch (error: any) {
      alert('❌ 조회 실패: ' + error.message);
    }
  };

  // 테스트용: 100% 달성 프로젝트 일괄 완료 처리
  const handleMigrateFundedProjects = async () => {
    if (!confirm('100% 달성한 ACTIVE 프로젝트를 모두 COMPLETED로 변경하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/donations/migrate-funded-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('마이그레이션 실패');
      }

      const result = await response.json();
      console.log('✅ 마이그레이션 결과:', result);
      alert(`✅ 완료!\n\n완료 처리: ${result.completedProjectCount}개\n저금통 생성: ${result.piggyBankCreatedCount}개\n\nProject IDs: ${result.completedProjectIds.join(', ')}`);
      refetch();
    } catch (error: any) {
      alert('❌ 마이그레이션 실패: ' + error.message);
    }
  };

  // Debounce 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setCurrentPage(1); // 검색 시 첫 페이지로 이동
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortOption]);

  // API: 통계 조회
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useOrganizationStats();

  // API: 프로젝트 목록 조회
  const {
    data: projects,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    refetch
  } = useOrganizationProjects({
    status: statusFilter || undefined,
    search: debouncedSearchKeyword.trim() || undefined,
    sortBy: sortOption,
    page: currentPage - 1, // 백엔드는 0부터 시작
    size: pageSize,
  });

  // Helper Functions
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold">프로젝트 관리</h1>
            <Link
              to="/projects/create"
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              + 새 프로젝트 등록
            </Link>
          </div>

          {/* 테스트 도구 */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-bold text-red-600 mb-2">🔧 정산 테스트 도구</p>
            <div className="flex gap-2">
              <button
                onClick={handleTestList}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                목록 조회
              </button>
              <button
                onClick={handleTestApprove}
                className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                승인
              </button>
              <button
                onClick={handleTestReject}
                className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                반려
              </button>
              <button
                onClick={handleMigrateFundedProjects}
                className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                100% 프로젝트 완료처리
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            ))}
          </div>
        ) : isErrorStats ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">통계를 불러오는데 실패했습니다.</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* 전체 프로젝트 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="text-gray-600" size={20} />
                <p className="text-sm text-gray-600 font-medium">전체 프로젝트</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalProjects}개</p>
            </div>

            {/* 진행 중 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-blue-600" size={20} />
                <p className="text-sm text-blue-700 font-medium">진행 중</p>
              </div>
              <p className="text-3xl font-bold text-blue-900 mb-1">{stats.activeProjects}개</p>
              <p className="text-xs text-blue-600">{formatAmount(stats.activeFunding)}원 모금 중</p>
            </div>

            {/* 결산 중 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="text-orange-600" size={20} />
                <p className="text-sm text-orange-700 font-medium">결산 중</p>
              </div>
              <p className="text-3xl font-bold text-orange-900 mb-1">{stats.settlementProjects}개</p>
              <p className="text-xs text-orange-600">저금통 {formatAmount(stats.totalWalletBalance)}원</p>
            </div>

            {/* 종료됨 */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-gray-600" size={20} />
                <p className="text-sm text-gray-700 font-medium">종료됨</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.closedProjects}개</p>
            </div>

            {/* 총 모금액 */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-red-600" size={20} />
                <p className="text-sm text-red-700 font-medium">총 모금액</p>
              </div>
              <p className="text-2xl font-bold text-red-900 mb-1">{formatAmount(stats.totalFunding)}원</p>
            </div>
          </div>
        ) : null}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* 검색창 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="프로젝트 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
              {isLoadingProjects && searchKeyword !== debouncedSearchKeyword && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={18} />
              )}
            </div>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="">전체</option>
              <option value="active">모금 진행 중</option>
              <option value="completed">모금 완료 (정산 대기 중)</option>
              <option value="settlement">결산 중</option>
              <option value="closed">종료</option>
            </select>

            {/* 정렬 */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감임박순</option>
              <option value="fundingRate">모금률순</option>
            </select>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {isLoadingProjects ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isErrorProjects ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">프로젝트를 불러오는데 실패했습니다.</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        ) : displayProjects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {searchKeyword || statusFilter
                ? '검색 결과가 없습니다.'
                : '등록된 프로젝트가 없습니다.'
              }
            </p>
            <Link
              to="/projects/create"
              className="inline-block px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
            >
              첫 프로젝트 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayProjects.map((project) => {
              const progress = calculatePercentage(project.currentAmount, project.targetAmount);
              const categoryKo = getCategoryLabel(project.category);
              const statusInfo = getStatusBadge(project.status || 'active');

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* 프로젝트 이미지 */}
                    <div className="md:w-48 h-48 md:h-auto bg-gray-200 flex-shrink-0">
                      {project.image ? (
                        <img
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.image}`}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BarChart3 size={48} />
                        </div>
                      )}
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold">
                              {categoryKo}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                        </div>
                      </div>

                      {/* 진행률 */}
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

                      {/* 통계 */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span>현재: <strong className="text-gray-900">{formatAmount(project.currentAmount)}원</strong></span>
                        <span>목표: <strong className="text-gray-900">{formatAmount(project.targetAmount)}원</strong></span>
                        <span>참여: <strong className="text-gray-900">{project.donors}명</strong></span>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        {/* 수정 버튼: CLOSED, CANCELLED, REJECTED 제외한 모든 상태에서 표시 */}
                        {canEditProject(project.status) && (
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowEditModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Edit size={16} />
                            수정
                          </button>
                        )}
                        {(project.status?.toLowerCase() === 'settlement' || project.status?.toLowerCase() === 'closed') && (
                          <Link
                            to={`/organization/projects/${project.id}/piggybank`}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <Wallet size={16} />
                            저금통 관리
                          </Link>
                        )}
                        {project.status?.toLowerCase() === 'completed' && (
                          <>
                            {/* Settlement이 없거나 REJECTED인 경우: 정산 요청 버튼 */}
                            {(!project.settlementStatus || project.settlementStatus === 'REJECTED') && (
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setShowSettlementModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <Wallet size={16} />
                                정산 요청
                              </button>
                            )}
                            {/* Settlement PENDING: 정산 대기 중 */}
                            {project.settlementStatus === 'PENDING' && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-300">
                                <Wallet size={16} />
                                정산 대기 중
                              </div>
                            )}
                            {/* Settlement APPROVED: 저금통 관리 */}
                            {project.settlementStatus === 'APPROVED' && (
                              <Link
                                to={`/organization/projects/${project.id}/piggybank`}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                              >
                                <Wallet size={16} />
                                저금통 관리
                              </Link>
                            )}
                          </>
                        )}
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Eye size={16} />
                          상세보기
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
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

        {/* 정산 요청 모달 */}
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

        {/* 프로젝트 수정 모달 */}
        {showEditModal && selectedProject && (
          <EditProjectModal
            project={selectedProject}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProject(null);
            }}
            onSubmit={async (title, description) => {
              await updateProjectMutation.mutateAsync({
                projectId: selectedProject.id,
                title,
                description,
              });
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OrganizationDashboardPage;
