import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, FileText, CheckCircle, XCircle, Eye, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Search, RefreshCw, Receipt, Tag, Clock, Download, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApproveExpense, useRejectExpense } from '../../hooks/useExpenses';
import { getAllExpensesByStatus } from '../../api/expenses';
import type { Expense } from '../../types';
import ConfirmModal from '../../components/common/ConfirmModal';

type TabType = 'pending' | 'processed';
type ProcessedFilterType = 'ALL' | 'APPROVED' | 'REJECTED';

const PAGE_SIZE = 10;

/**
 * 관리자 지출 승인 관리 페이지
 */
const ExpenseApprovalPage: React.FC = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [processedFilter, setProcessedFilter] = useState<ProcessedFilterType>('ALL');

  // 데이터 상태
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 모달 상태
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingApproveId, setPendingApproveId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // API: 지출 승인
  const approveMutation = useApproveExpense();

  // API: 지출 반려
  const rejectMutation = useRejectExpense();

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 모든 상태의 지출 가져오기
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getAllExpensesByStatus('PENDING'),
        getAllExpensesByStatus('APPROVED'),
        getAllExpensesByStatus('REJECTED'),
      ]);

      setAllExpenses([
        ...(pendingRes || []),
        ...(approvedRes || []),
        ...(rejectedRes || []),
      ].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()));

    } catch (error) {
      console.error('지출 데이터 로드 실패:', error);
      toast.error('지출 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

      // 파일명 추출
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

  const handleApprove = (expenseId: number) => {
    setPendingApproveId(expenseId);
    setShowConfirmModal(true);
  };

  const confirmApprove = async () => {
    if (!pendingApproveId) return;

    try {
      await approveMutation.mutateAsync(pendingApproveId);
      toast.success('지출이 승인되었습니다.');
      setShowDetailModal(false);
      setSelectedExpense(null);
      setShowConfirmModal(false);
      setPendingApproveId(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '지출 승인에 실패했습니다.');
    }
  };

  const handleDetailClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  };

  const handleRejectClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowRejectModal(true);
    setShowDetailModal(false);
    setRejectReason('');
  };

  const handleRejectSubmit = async () => {
    if (!selectedExpense) return;

    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        expenseId: selectedExpense.expenseId,
        reason: rejectReason,
      });
      toast.success('지출이 반려되었습니다.');
      setShowRejectModal(false);
      setSelectedExpense(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '지출 반려에 실패했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '승인 대기';
      case 'APPROVED':
        return '승인됨';
      case 'REJECTED':
        return '반려됨';
      default:
        return status;
    }
  };

  // 대기 중인 지출 개수 (배지용)
  const pendingCount = allExpenses.filter(e => e.status === 'PENDING').length;

  // 필터링된 데이터
  const getFilteredExpenses = () => {
    let filtered = allExpenses;

    // 탭별 필터링
    if (activeTab === 'pending') {
      filtered = filtered.filter(e => e.status === 'PENDING');
    } else {
      // 처리 내역 탭
      filtered = filtered.filter(e => e.status === 'APPROVED' || e.status === 'REJECTED');

      // 추가 상태 필터링
      if (processedFilter !== 'ALL') {
        filtered = filtered.filter(e => e.status === processedFilter);
      }
    }

    // 검색어 필터링
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.projectTitle?.toLowerCase().includes(term) ||
        expense.category?.toLowerCase().includes(term) ||
        expense.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
  const paginatedExpenses = filteredExpenses.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // 탭, 필터, 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, processedFilter, searchTerm]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">지출 승인 관리</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">기관의 지출 요청을 검토하고 승인/반려합니다</p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition disabled:opacity-50 text-xs md:text-sm"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">새로고침</span>
        </button>
      </div>

      {/* 탭 */}
      <div className="flex flex-col sm:flex-row gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === 'pending'
              ? 'bg-white text-amber-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          승인 대기
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('processed')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === 'processed'
              ? 'bg-white text-amber-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          처리 내역
        </button>
      </div>

      {/* 지출 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* 필터 및 검색 */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="프로젝트명, 카테고리, 설명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>
          {activeTab === 'processed' && (
            <select
              value={processedFilter}
              onChange={(e) => setProcessedFilter(e.target.value as ProcessedFilterType)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="ALL">모든 상태</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">반려됨</option>
            </select>
          )}
          </div>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">지출 내역을 불러오는 중...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm
                ? '검색 결과가 없습니다.'
                : activeTab === 'pending'
                ? '대기 중인 지출 요청이 없습니다.'
                : '처리된 지출 내역이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-gray-700 whitespace-nowrap text-sm">날짜</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-gray-700 whitespace-nowrap text-sm hidden md:table-cell">프로젝트</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-6 font-semibold text-gray-700 whitespace-nowrap text-sm">카테고리</th>
                  <th className="text-right py-3 md:py-4 px-3 md:px-6 font-semibold text-gray-700 whitespace-nowrap text-sm">금액</th>
                  <th className="text-center py-3 md:py-4 px-3 md:px-6 font-semibold text-gray-700 whitespace-nowrap text-sm">상태</th>
                  <th className="text-center py-3 md:py-4 px-3 md:px-6 font-semibold text-gray-700 whitespace-nowrap text-sm">작업</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.expenseId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 md:py-4 px-3 md:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{formatDate(expense.expenseDate)}</span>
                      </div>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 hidden md:table-cell">
                      <span className="text-sm font-medium text-gray-800 line-clamp-1 max-w-[200px]" title={expense.projectTitle || `#${expense.projectId}`}>
                        {expense.projectTitle || `#${expense.projectId}`}
                      </span>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium inline-block max-w-[120px] truncate" title={expense.category}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 text-right whitespace-nowrap">
                      <span className="font-bold text-amber-600 text-sm">
                        {formatAmount(expense.amount)}원
                      </span>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(expense.status)}`}>
                        {getStatusLabel(expense.status)}
                      </span>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDetailClick(expense)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          title="상세보기"
                        >
                          <Eye size={18} />
                        </button>
                        {expense.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(expense.expenseId)}
                              disabled={approveMutation.isPending}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="승인"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectClick(expense)}
                              disabled={rejectMutation.isPending}
                              className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="반려"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {!isLoading && filteredExpenses.length > 0 && (
          <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              총 <strong>{filteredExpenses.length}</strong>건
              {filteredExpenses.length > 0 && (
                <span className="ml-2 hidden md:inline">
                  ({currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, filteredExpenses.length)}건 표시)
                </span>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(page => {
                      return Math.abs(page - currentPage) <= 2 || page === 0 || page === totalPages - 1;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-amber-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page + 1}
                        </button>
                      </React.Fragment>
                    ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl w-full max-w-[95%] md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-4 md:px-6 py-4 md:py-5">
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
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedExpense(null);
                  }}
                  className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto">
              {/* 프로젝트 정보 카드 */}
              <div className="bg-amber-500 px-4 md:px-6 py-4 md:py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-amber-100 text-sm">지출 대상 프로젝트</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedExpense.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : selectedExpense.status === 'PENDING'
                      ? 'bg-white/90 text-amber-700'
                      : selectedExpense.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-stone-100 text-stone-700'
                  }`}>
                    {getStatusLabel(selectedExpense.status)}
                  </span>
                </div>
                <h3 className="text-white font-medium text-lg mb-4 line-clamp-1">{selectedExpense.projectTitle || `프로젝트 #${selectedExpense.projectId}`}</h3>
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

              <div className="p-4 md:p-6 space-y-5 md:space-y-6">
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

                  <div className="bg-white rounded-xl border border-stone-200 p-4">
                    {selectedExpense.receiptUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                            {getFileType(selectedExpense.receiptUrl) === 'pdf' ? (
                              <FileText size={20} className="text-red-500" />
                            ) : (
                              <Receipt size={20} className="text-amber-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-stone-800 text-sm truncate max-w-[180px]">
                              {selectedExpense.receiptUrl.split('/').pop() || '영수증'}
                            </p>
                            <p className="text-xs text-stone-500">
                              {getFileType(selectedExpense.receiptUrl) === 'pdf' ? 'PDF 문서' : '이미지 파일'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadReceipt(selectedExpense.receiptUrl!)}
                          disabled={isDownloading}
                          className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isDownloading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Receipt size={32} className="mx-auto text-stone-300 mb-2" />
                        <p className="text-sm text-stone-500">첨부된 영수증이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 반려 사유 (반려된 경우) */}
                {selectedExpense.status === 'REJECTED' && selectedExpense.rejectionReason && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle size={18} className="text-red-500" />
                      <span className="font-medium text-red-800">반려 사유</span>
                    </div>
                    <p className="text-sm text-red-700 ml-7">{selectedExpense.rejectionReason}</p>
                  </div>
                )}

                {/* 대기중일 때 주의사항 */}
                {selectedExpense.status === 'PENDING' && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={18} className="text-amber-600" />
                      <span className="font-medium text-amber-800">주의사항</span>
                    </div>
                    <ul className="space-y-1 text-sm text-amber-700 ml-7">
                      <li>• 지출 승인 시 저금통에서 해당 금액이 차감됩니다.</li>
                      <li>• 영수증을 반드시 확인하신 후 처리해주세요.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="bg-white border-t border-stone-200 px-4 md:px-6 py-4 flex gap-2 md:gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedExpense(null);
                }}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition"
              >
                닫기
              </button>
              {selectedExpense.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleRejectClick(selectedExpense)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 disabled:opacity-50 transition"
                  >
                    반려
                  </button>
                  <button
                    onClick={() => handleApprove(selectedExpense.expenseId)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition"
                  >
                    {approveMutation.isPending ? '처리 중...' : '승인'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 반려 모달 */}
      {showRejectModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl w-full max-w-[95%] md:max-w-md overflow-hidden">
            {/* 헤더 */}
            <div className="bg-stone-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">지출 반려</h2>
                  <p className="text-sm text-stone-400">반려 사유를 입력해주세요</p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <p className="text-sm text-stone-600 mb-1">카테고리: {selectedExpense.category}</p>
                <p className="text-sm text-stone-600 mb-1">금액: {formatAmount(selectedExpense.amount)}원</p>
                <p className="text-sm text-stone-600">설명: {selectedExpense.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  반려 사유 <span className="text-amber-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-3 min-h-[100px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="지출을 반려하는 사유를 입력해주세요..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedExpense(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-100"
                >
                  취소
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectMutation.isPending ? '처리 중...' : '반려'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 승인 확인 모달 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="지출 승인"
        message="이 지출을 승인하시겠습니까? 승인 시 저금통에서 차감됩니다."
        confirmText="승인"
        onConfirm={confirmApprove}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingApproveId(null);
        }}
        isLoading={approveMutation.isPending}
      />
    </div>
  );
};

export default ExpenseApprovalPage;
