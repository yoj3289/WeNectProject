import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, FileText, CheckCircle, XCircle, Eye, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Search, RefreshCw, Receipt, Tag, Clock, Download } from 'lucide-react';
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
    <div className="p-8">
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">지출 승인 관리</h1>
          <p className="text-sm text-gray-600 mt-1">기관의 지출 요청을 검토하고 승인/반려합니다</p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === 'pending'
              ? 'bg-white text-orange-600 shadow'
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
              ? 'bg-white text-orange-600 shadow'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          처리 내역
        </button>
      </div>

      {/* 지출 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* 필터 및 검색 */}
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="프로젝트명, 카테고리, 설명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'processed' && (
            <select
              value={processedFilter}
              onChange={(e) => setProcessedFilter(e.target.value as ProcessedFilterType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">모든 상태</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">반려됨</option>
            </select>
          )}
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
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
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">날짜</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">프로젝트</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">카테고리</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">금액</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">상태</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.expenseId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{formatDate(expense.expenseDate)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-800 line-clamp-1 max-w-[200px]" title={expense.projectTitle || `#${expense.projectId}`}>
                        {expense.projectTitle || `#${expense.projectId}`}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium inline-block max-w-[120px] truncate" title={expense.category}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span className="font-bold text-orange-600">
                        {formatAmount(expense.amount)}원
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(expense.status)}`}>
                        {getStatusLabel(expense.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
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
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <strong>{filteredExpenses.length}</strong>건
              {filteredExpenses.length > 0 && (
                <span className="ml-2">
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
                              ? 'bg-orange-500 text-white'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">지출 상세</h2>
                <p className="text-sm text-gray-600 mt-1">지출 정보를 확인하고 처리하세요</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedExpense(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedExpense.status)}`}>
                  {getStatusLabel(selectedExpense.status)}
                </span>
                <h3 className="text-2xl font-bold text-gray-800 mt-3">{selectedExpense.projectTitle || `프로젝트 #${selectedExpense.projectId}`}</h3>
                <p className="text-sm text-gray-500 mt-1">프로젝트 ID: #{selectedExpense.projectId}</p>
                <div className="bg-white rounded-lg p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">지출 금액</span>
                    <span className="text-3xl font-bold text-orange-600">{formatAmount(selectedExpense.amount)}원</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">지출일</span>
                    <span className="font-semibold text-gray-800">{formatDate(selectedExpense.expenseDate)}</span>
                  </div>
                </div>
              </div>

              {/* 지출 정보 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Tag size={20} className="text-blue-500" />
                  지출 정보
                </h4>
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">카테고리</span>
                    <span className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm font-semibold border border-gray-200 inline-block">
                      {selectedExpense.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">설명</span>
                    <p className="font-medium text-gray-800 whitespace-pre-wrap break-words">
                      {selectedExpense.description || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 영수증 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Receipt size={20} className="text-purple-500" />
                  영수증
                </h4>
                {selectedExpense.receiptUrl ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {getFileType(selectedExpense.receiptUrl) === 'pdf' ? (
                          <FileText size={20} className="text-red-500" />
                        ) : getFileType(selectedExpense.receiptUrl) === 'image' ? (
                          <Receipt size={20} className="text-purple-500" />
                        ) : (
                          <FileText size={20} className="text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {selectedExpense.receiptUrl.split('/').pop() || '영수증'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getFileType(selectedExpense.receiptUrl) === 'pdf' ? 'PDF 문서' :
                           getFileType(selectedExpense.receiptUrl) === 'image' ? '이미지 파일' : '문서 파일'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadReceipt(selectedExpense.receiptUrl!)}
                      disabled={isDownloading}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">첨부된 영수증이 없습니다</p>
                  </div>
                )}
              </div>

              {/* 반려 사유 (반려된 경우) */}
              {selectedExpense.status === 'REJECTED' && selectedExpense.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                    <XCircle size={20} className="text-red-600" />
                    반려 사유
                  </h4>
                  <p className="text-red-900">{selectedExpense.rejectionReason}</p>
                </div>
              )}

              {/* 대기중일 때 주의사항 */}
              {selectedExpense.status === 'PENDING' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} className="text-amber-600" />
                    주의사항
                  </h4>
                  <ul className="space-y-2 text-sm text-amber-900">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>지출 승인 시 저금통에서 해당 금액이 차감됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>영수증을 반드시 확인하신 후 처리해주세요.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedExpense(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
              >
                닫기
              </button>
              {selectedExpense.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleRejectClick(selectedExpense)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50"
                  >
                    반려
                  </button>
                  <button
                    onClick={() => handleApprove(selectedExpense.expenseId)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">지출 반려</h2>
                <p className="text-sm text-gray-600">반려 사유를 입력해주세요</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">카테고리: {selectedExpense.category}</p>
              <p className="text-sm text-gray-600 mb-1">금액: {formatAmount(selectedExpense.amount)}원</p>
              <p className="text-sm text-gray-600">설명: {selectedExpense.description}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반려 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="지출을 반려하는 사유를 입력해주세요..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedExpense(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectMutation.isPending ? '처리 중...' : '반려'}
              </button>
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
