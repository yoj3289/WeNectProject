import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingDown, Calendar, FileText, Download, AlertCircle, Eye, X, ArrowUpDown, Tag, Receipt, XCircle, Clock, Loader2, Building2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePiggyBankByProject, usePiggyBankDetail } from '../../hooks/usePiggyBanks';
import { useCloseProjectSettlement, useProject } from '../../hooks/useProjects';
import { WithdrawalModal } from '../../components/piggybank/WithdrawalModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Expense } from '../../types';

/**
 * 저금통 관리 페이지
 * - 저금통 상세 정보 조회
 * - 인출 내역 확인
 * - 카테고리별 통계
 * - 인출 요청
 * - 프로젝트 종료 (저금통 잔액 0원 시)
 */
const PiggyBankManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCloseProjectModal, setShowCloseProjectModal] = useState(false);

  // API: 프로젝트 정보 조회 (상태 확인용)
  const { data: project, isLoading: isLoadingProject } = useProject(Number(projectId));

  // API: projectId로 먼저 저금통 조회하여 piggyId를 얻음
  const {
    data: basicPiggyBank,
    isLoading: isLoadingBasic,
    isError: isErrorBasic
  } = usePiggyBankByProject(Number(projectId));

  // API: piggyId로 저금통 상세 정보 조회 (지출 내역 포함)
  const {
    data: piggyBank,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    refetch
  } = usePiggyBankDetail(basicPiggyBank?.piggyId ?? null);

  // 프로젝트 종료 mutation
  const closeProjectMutation = useCloseProjectSettlement();

  const isLoading = isLoadingBasic || isLoadingDetail || isLoadingProject;
  const isError = isErrorBasic || isErrorDetail;

  const formatAmount = (amount: number): string => {
    return Math.floor(amount).toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 영수증 다운로드 함수
  const handleDownloadReceipt = async (receiptUrl: string) => {
    setIsDownloading(true);
    try {
      const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace('/api', '');
      const fullUrl = receiptUrl.startsWith('http') ? receiptUrl : `${backendBaseUrl}${receiptUrl}`;

      // 인증 토큰 가져오기
      const token = localStorage.getItem('accessToken');

      const response = await fetch(fullUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('파일 다운로드 실패');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = receiptUrl.split('/').pop() || '영수증';
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('영수증 다운로드 완료');
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast.error('파일 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 파일 확장자로 파일 타입 판별
  const getFileType = (url: string): 'image' | 'pdf' | 'document' => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'document';
  };

  // 필터링 및 정렬 기능
  const filteredAndSortedExpenses = useMemo(() => {
    if (!piggyBank?.withdrawalHistory) return [];

    // 1. 상태 필터링
    let expenses = [...piggyBank.withdrawalHistory];
    if (statusFilter !== 'ALL') {
      expenses = expenses.filter(expense => expense.status === statusFilter);
    }

    // 2. 정렬
    expenses.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return expenses;
  }, [piggyBank?.withdrawalHistory, sortField, sortOrder, statusFilter]);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 프로젝트 상태 확인
  const isProjectClosed = project?.status?.toUpperCase() === 'CLOSED';

  const canWithdraw = piggyBank?.status === 'ACTIVE' && (piggyBank?.balance ?? 0) > 0 && !isProjectClosed;
  // 잔액이 0이 되면 저금통 상태가 자동으로 WITHDRAWN으로 변경됨
  // 프로젝트가 이미 CLOSED 상태면 종료 버튼 대신 종료됨 상태 표시
  const canCloseProject = piggyBank?.status === 'WITHDRAWN' && piggyBank?.balance === 0 && !isProjectClosed;

  // 프로젝트 종료 핸들러
  const handleCloseProject = async () => {
    try {
      await closeProjectMutation.mutateAsync(Number(projectId));
      setShowCloseProjectModal(false);
      toast.success('프로젝트가 성공적으로 종료되었습니다.');
      navigate('/organization/dashboard');
    } catch (error: any) {
      setShowCloseProjectModal(false);
      toast.error(error.message || '프로젝트 종료에 실패했습니다.');
    }
  };

  // 로딩 상태 - 전체 페이지 로딩 스피너
  if (isLoading) {
    return (
      <div className="bg-stone-50 min-h-screen">
        {/* 다크 헤더 */}
        <div className="bg-stone-900 text-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/organization/dashboard')}
                className="p-2 hover:bg-stone-800 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg sm:rounded-xl">
                  <Wallet className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold">저금통 관리</h1>
                  <p className="text-stone-400 text-xs sm:text-sm mt-0.5">저금통 정보를 불러오는 중...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" message="저금통 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError || !piggyBank) {
    return (
      <div className="bg-stone-50 min-h-screen">
        {/* 다크 헤더 */}
        <div className="bg-stone-900 text-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/organization/dashboard')}
                className="p-2 hover:bg-stone-800 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg sm:rounded-xl">
                  <Wallet className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold">저금통 관리</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-stone-600 mb-4">저금통 정보를 불러오는데 실패했습니다.</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* 다크 헤더 */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/organization/dashboard')}
                className="p-2 hover:bg-stone-800 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg sm:rounded-xl">
                  <Wallet className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold">저금통 관리</h1>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-stone-400 text-xs sm:text-sm">
                    <Building2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{piggyBank.projectTitle}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-auto sm:ml-0">
              {isProjectClosed ? (
                <span className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                  종료됨
                </span>
              ) : (
                <>
                  {canWithdraw && (
                    <button
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      className="px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      지출 등록
                    </button>
                  )}
                  {canCloseProject && (
                    <button
                      onClick={() => setShowCloseProjectModal(true)}
                      className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      프로젝트 종료
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* 저금통 요약 카드 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {/* 총 금액 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg sm:rounded-xl w-fit">
                <Wallet className="text-amber-500 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-[10px] sm:text-sm text-stone-600 font-medium">총 금액</p>
            </div>
            <p className="text-sm sm:text-2xl md:text-3xl font-bold text-amber-600 mb-0.5 sm:mb-1 break-all">
              {formatAmount(piggyBank.totalAmount)}원
            </p>
            <p className="text-[10px] sm:text-xs text-stone-500 hidden sm:block">정산 승인 금액</p>
          </div>

          {/* 인출 금액 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg sm:rounded-xl w-fit">
                <TrendingDown className="text-green-500 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-[10px] sm:text-sm text-stone-600 font-medium">인출</p>
            </div>
            <p className="text-sm sm:text-2xl md:text-3xl font-bold text-green-600 mb-0.5 sm:mb-1 break-all">
              {formatAmount(piggyBank.withdrawnAmount)}원
            </p>
            <p className="text-[10px] sm:text-xs text-stone-500">
              {piggyBank.withdrawalHistory.length}건
            </p>
          </div>

          {/* 잔액 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-stone-100 rounded-lg sm:rounded-xl w-fit">
                <Wallet className="text-stone-600 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-[10px] sm:text-sm text-stone-600 font-medium">잔액</p>
            </div>
            <p className="text-sm sm:text-2xl md:text-3xl font-bold text-stone-800 mb-0.5 sm:mb-1 break-all">
              {formatAmount(piggyBank.balance)}원
            </p>
            <p className="text-[10px] sm:text-xs text-stone-500 hidden sm:block">
              {isProjectClosed ? '프로젝트 종료됨' : canCloseProject ? '프로젝트 종료 가능' : canWithdraw ? '인출 가능' : '인출 완료'}
            </p>
          </div>
        </div>

        {/* 카테고리별 통계 - 막대 그래프 */}
        {piggyBank.categoryStats && piggyBank.categoryStats.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 mb-6">
            <h2 className="text-lg font-bold text-stone-900 mb-6">카테고리별 지출 통계</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {piggyBank.categoryStats
                .sort((a, b) => b.amount - a.amount)
                .map((stat, index) => {
                  const colors = [
                    'bg-amber-500',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-yellow-500',
                    'bg-red-500',
                    'bg-indigo-500',
                    'bg-teal-500',
                    'bg-cyan-500',
                  ];
                  const barColor = colors[index % colors.length];

                  return (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`w-3 h-3 rounded-full ${barColor} flex-shrink-0`}
                          ></span>
                          <span className="font-medium text-stone-800 truncate">
                            {stat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className="text-sm text-stone-500">{stat.count}건</span>
                          <span className="font-bold text-stone-900 min-w-[100px] text-right">
                            {formatAmount(stat.amount)}원
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                            style={{ width: `${Math.max(stat.percentage, 2)}%` }}
                          >
                            {stat.percentage >= 10 && (
                              <span className="text-xs text-white font-medium">
                                {stat.percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {stat.percentage < 10 && (
                          <span className="text-xs text-stone-500 w-12">
                            {stat.percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            {piggyBank.categoryStats.length > 5 && (
              <p className="text-xs text-stone-400 mt-4 text-center">
                스크롤하여 더 보기
              </p>
            )}
          </div>
        )}

        {/* 지출 내역 */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-stone-900">지출 내역</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-stone-600">
                총 {piggyBank.withdrawalHistory.length}건
                {statusFilter !== 'ALL' && ` (필터링: ${filteredAndSortedExpenses.length}건)`}
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-stone-600">상태:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="border border-stone-200 rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">전체</option>
                  <option value="PENDING">대기중</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="REJECTED">반려됨</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpDown size={16} className="text-stone-500" />
                <span className="text-stone-600">정렬:</span>
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [typeof sortField, typeof sortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="border border-stone-200 rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="date-desc">날짜 (최신순)</option>
                  <option value="date-asc">날짜 (오래된순)</option>
                  <option value="amount-desc">금액 (높은순)</option>
                  <option value="amount-asc">금액 (낮은순)</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAndSortedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">
                {statusFilter === 'ALL'
                  ? '아직 지출 내역이 없습니다.'
                  : `${statusFilter === 'PENDING' ? '대기중' : statusFilter === 'APPROVED' ? '승인된' : '반려된'} 지출 내역이 없습니다.`}
              </p>
              {canWithdraw && statusFilter === 'ALL' && (
                <button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="mt-4 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600"
                >
                  지출 내역 등록
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-3 md:px-4 font-medium text-stone-600 whitespace-nowrap w-[110px] md:w-auto">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-stone-900"
                      >
                        날짜
                        {sortField === 'date' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 md:px-4 font-medium text-stone-600 whitespace-nowrap">
                      카테고리
                    </th>
                    <th className="text-right py-3 px-3 md:px-4 font-medium text-stone-600 whitespace-nowrap w-[120px] md:w-auto">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1 hover:text-stone-900 ml-auto"
                      >
                        금액
                        {sortField === 'amount' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-3 md:px-4 font-medium text-stone-600 whitespace-nowrap w-[80px] md:w-auto">
                      상태
                    </th>
                    <th className="text-center py-3 px-3 md:px-4 font-medium text-stone-600 whitespace-nowrap w-[100px] md:w-auto">
                      상세 정보
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedExpenses.map((expense) => (
                    <tr
                      key={expense.expenseId}
                      className="border-b border-stone-100 hover:bg-stone-50"
                    >
                      <td className="py-3 px-3 md:py-4 md:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Calendar size={14} className="text-stone-400 flex-shrink-0 md:w-4 md:h-4" />
                          <span className="text-xs md:text-sm text-stone-700">
                            {formatDate(expense.expenseDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4">
                        <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium whitespace-nowrap inline-block max-w-[120px] truncate" title={expense.category}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-amber-600 text-sm md:text-base">
                          {formatAmount(expense.amount)}원
                        </span>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                        <span
                          className={`px-2 py-0.5 md:py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                            expense.status === 'APPROVED'
                              ? 'bg-green-50 text-green-700'
                              : expense.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700'
                              : expense.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {expense.status === 'APPROVED'
                            ? '승인됨'
                            : expense.status === 'PENDING'
                            ? '대기중'
                            : expense.status === 'REJECTED'
                            ? '반려됨'
                            : expense.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                        <button
                          onClick={() => setSelectedExpense(expense)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 bg-amber-500 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-amber-600 transition-colors whitespace-nowrap"
                        >
                          <Eye size={14} className="md:w-4 md:h-4" />
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 저금통 상태 안내 */}
        {isProjectClosed ? (
          <div className="mt-6 bg-green-50/50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-medium text-green-800 mb-1">
                  프로젝트가 종료되었습니다
                </h3>
                <p className="text-sm text-green-700">
                  이 프로젝트의 결산이 완료되었습니다. 지출 내역을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        ) : canCloseProject && (
          <div className="mt-6 bg-green-50/50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-medium text-green-800 mb-1">
                  프로젝트 종료가 가능합니다
                </h3>
                <p className="text-sm text-green-700">
                  저금통 잔액이 모두 사용되었습니다. 프로젝트를 종료하여 결산을 완료하세요.
                </p>
              </div>
              <button
                onClick={() => setShowCloseProjectModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                프로젝트 종료
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 지출 상세 모달 */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Receipt size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">지출 상세</h2>
                    <p className="text-sm text-stone-400">지출 정보를 확인하세요</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto">
              {/* 프로젝트 정보 카드 */}
              <div className="bg-amber-500 px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-amber-100 text-sm">지출 대상 프로젝트</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedExpense.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : selectedExpense.status === 'PENDING'
                        ? 'bg-white/90 text-amber-700'
                        : selectedExpense.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {selectedExpense.status === 'APPROVED'
                      ? '승인됨'
                      : selectedExpense.status === 'PENDING'
                      ? '승인 대기'
                      : selectedExpense.status === 'REJECTED'
                      ? '반려됨'
                      : selectedExpense.status}
                  </span>
                </div>
                <h3 className="text-white font-medium text-lg mb-4 line-clamp-1">{piggyBank.projectTitle}</h3>
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={18} className="text-white" />
                      <span className="text-white/90 text-sm">지출 금액</span>
                    </div>
                    <span className="text-white text-xl font-bold">{formatAmount(selectedExpense.amount)}원</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/70" />
                      <span className="text-white/70">지출일</span>
                    </div>
                    <span className="text-white/90 font-medium">{formatDate(selectedExpense.expenseDate)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* STEP 1: 지출 정보 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <h4 className="font-medium text-stone-800">지출 정보</h4>
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm text-stone-600 mb-1.5">
                        <Tag size={14} />
                        카테고리
                      </label>
                      <span className="px-3 py-1.5 bg-stone-50 text-stone-700 rounded-lg text-sm font-medium border border-stone-200 inline-block">
                        {selectedExpense.category}
                      </span>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-sm text-stone-600 mb-1.5">
                        <FileText size={14} />
                        설명
                      </label>
                      <div className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                        {selectedExpense.description || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 2: 영수증 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <h4 className="font-medium text-stone-800">영수증</h4>
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    {selectedExpense.receiptUrl ? (
                      <div className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                            {getFileType(selectedExpense.receiptUrl) === 'pdf' ? (
                              <FileText size={20} className="text-red-500" />
                            ) : getFileType(selectedExpense.receiptUrl) === 'image' ? (
                              <Receipt size={20} className="text-amber-500" />
                            ) : (
                              <FileText size={20} className="text-blue-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-stone-800 truncate max-w-[180px]">
                              {selectedExpense.receiptUrl.split('/').pop() || '영수증'}
                            </p>
                            <p className="text-xs text-stone-500">
                              {getFileType(selectedExpense.receiptUrl) === 'pdf' ? 'PDF 문서' :
                               getFileType(selectedExpense.receiptUrl) === 'image' ? '이미지 파일' : '문서 파일'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadReceipt(selectedExpense.receiptUrl!)}
                          disabled={isDownloading}
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              다운로드 중...
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              다운로드
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Receipt size={24} className="text-stone-400" />
                        </div>
                        <p className="text-sm text-stone-500">첨부된 영수증이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 상태별 알림 박스 */}
                {selectedExpense.status === 'PENDING' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-amber-800 mb-1">승인 대기 중</h5>
                        <p className="text-sm text-amber-700">
                          관리자의 승인을 기다리고 있습니다. 승인 후 저금통에서 금액이 차감됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedExpense.status === 'APPROVED' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} className="text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-green-800 mb-1">승인 완료</h5>
                        <p className="text-sm text-green-700">
                          지출이 승인되었습니다. 저금통에서 금액이 차감되었습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedExpense.status === 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <XCircle size={16} className="text-red-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-red-800 mb-1">반려됨</h5>
                        <p className="text-sm text-red-700">
                          {selectedExpense.rejectionReason || '지출 요청이 반려되었습니다.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 영역 */}
            <div className="bg-white border-t border-stone-200 px-6 py-4">
              <button
                onClick={() => setSelectedExpense(null)}
                className="w-full px-6 py-3 text-stone-600 rounded-xl font-medium hover:bg-stone-100 transition-colors border border-stone-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 인출 모달 */}
      {isWithdrawalModalOpen && (
        <WithdrawalModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          piggyId={piggyBank.piggyId}
          projectTitle={piggyBank.projectTitle}
          currentBalance={piggyBank.balance}
        />
      )}

      {/* 프로젝트 종료 확인 모달 */}
      <ConfirmModal
        isOpen={showCloseProjectModal}
        title="프로젝트 종료"
        message={`프로젝트를 종료하시겠습니까?
종료 후에는 더 이상 지출을 등록할 수 없습니다.`}
        confirmText="종료"
        cancelText="취소"
        onConfirm={handleCloseProject}
        onCancel={() => setShowCloseProjectModal(false)}
        isLoading={closeProjectMutation.isPending}
      />
    </div>
  );
};

export default PiggyBankManagementPage;
