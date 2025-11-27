import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingDown, Calendar, FileText, Download, AlertCircle, Eye, X, ArrowUpDown } from 'lucide-react';
import { usePiggyBankByProject, usePiggyBankDetail } from '../../hooks/usePiggyBanks';
import { WithdrawalModal } from '../../components/piggybank/WithdrawalModal';
import { SettlementRequestModal } from '../../components/settlement/SettlementRequestModal';
import type { Expense } from '../../types';

/**
 * 저금통 관리 페이지
 * - 저금통 상세 정보 조회
 * - 인출 내역 확인
 * - 카테고리별 통계
 * - 인출 요청
 * - 정산 요청
 */
const PiggyBankManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

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

  const isLoading = isLoadingBasic || isLoadingDetail;
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

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">저금통 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isError || !piggyBank) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">저금통 정보를 불러오는데 실패했습니다.</p>
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

  const canWithdraw = piggyBank.status === 'ACTIVE' && piggyBank.balance > 0;
  const canRequestSettlement = piggyBank.status === 'ACTIVE' && piggyBank.balance === 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/organization/dashboard')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">저금통 관리</h1>
              <p className="text-gray-600 mt-1">{piggyBank.projectTitle}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {canWithdraw && (
              <button
                onClick={() => setIsWithdrawalModalOpen(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                지출 내역 등록
              </button>
            )}
            {canRequestSettlement && (
              <button
                onClick={() => setIsSettlementModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                정산 요청
              </button>
            )}
          </div>
        </div>

        {/* 저금통 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 총 금액 */}
          <div className="bg-white rounded-xl p-6 border border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="text-red-600" size={20} />
              <p className="text-sm text-gray-900 font-medium">총 저금통 금액</p>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-1">
              {formatAmount(piggyBank.totalAmount)}원
            </p>
            <p className="text-xs text-gray-500">정산 승인 금액</p>
          </div>

          {/* 인출 금액 */}
          <div className="bg-white rounded-xl p-6 border border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="text-green-600" size={20} />
              <p className="text-sm text-gray-900 font-medium">총 인출 금액</p>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {formatAmount(piggyBank.withdrawnAmount)}원
            </p>
            <p className="text-xs text-gray-500">
              {piggyBank.withdrawalHistory.length}건 인출
            </p>
          </div>

          {/* 잔액 */}
          <div className="bg-white rounded-xl p-6 border border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="text-orange-600" size={20} />
              <p className="text-sm text-gray-900 font-medium">현재 잔액</p>
            </div>
            <p className="text-3xl font-bold text-orange-600 mb-1">
              {formatAmount(piggyBank.balance)}원
            </p>
            <p className="text-xs text-gray-500">
              {piggyBank.balance === 0 ? '정산 요청 가능' : '인출 가능'}
            </p>
          </div>
        </div>

        {/* 카테고리별 통계 */}
        {piggyBank.categoryStats && piggyBank.categoryStats.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-xl font-bold mb-4">카테고리별 지출 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {piggyBank.categoryStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stat.category}</h3>
                    <span className="text-sm text-gray-600">{stat.count}건</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatAmount(stat.amount)}원
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    전체의 {stat.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 지출 내역 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-bold">지출 내역</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-gray-600">
                총 {piggyBank.withdrawalHistory.length}건
                {statusFilter !== 'ALL' && ` (필터링: ${filteredAndSortedExpenses.length}건)`}
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">상태:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium"
                >
                  <option value="ALL">전체</option>
                  <option value="PENDING">대기중</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="REJECTED">반려됨</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpDown size={16} className="text-gray-600" />
                <span className="text-gray-600">정렬:</span>
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [typeof sortField, typeof sortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium"
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
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {statusFilter === 'ALL'
                  ? '아직 지출 내역이 없습니다.'
                  : `${statusFilter === 'PENDING' ? '대기중' : statusFilter === 'APPROVED' ? '승인된' : '반려된'} 지출 내역이 없습니다.`}
              </p>
              {canWithdraw && statusFilter === 'ALL' && (
                <button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600"
                >
                  지출 내역 등록
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[110px] md:w-auto">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        날짜
                        {sortField === 'date' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap">
                      카테고리
                    </th>
                    <th className="text-right py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[120px] md:w-auto">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1 hover:text-gray-900 ml-auto"
                      >
                        금액
                        {sortField === 'amount' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[80px] md:w-auto">
                      상태
                    </th>
                    <th className="text-center py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[100px] md:w-auto">
                      상세 정보
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedExpenses.map((expense) => (
                    <tr
                      key={expense.expenseId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 md:py-4 md:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0 md:w-4 md:h-4" />
                          <span className="text-xs md:text-sm">
                            {formatDate(expense.expenseDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium whitespace-nowrap inline-block max-w-[120px] truncate" title={expense.category}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-orange-600 text-sm md:text-base">
                          {formatAmount(expense.amount)}원
                        </span>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                        <span
                          className={`px-2 py-0.5 md:py-1 rounded text-xs font-semibold whitespace-nowrap ${
                            expense.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : expense.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : expense.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 bg-blue-600 text-white rounded md:rounded-lg text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
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
        {piggyBank.balance === 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  정산 요청이 가능합니다
                </h3>
                <p className="text-sm text-green-700">
                  저금통 잔액이 모두 사용되었습니다. 정산 요청을 통해 프로젝트를 종료할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setIsSettlementModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                정산 요청하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 지출 상세 모달 */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">지출 상세 정보</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDate(selectedExpense.expenseDate)}
                </p>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="px-6 py-6 space-y-5">
              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-base font-medium text-gray-900">{selectedExpense.category}</p>
                </div>
              </div>

              {/* 지출 금액 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  지출 금액
                </label>
                <div className="px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatAmount(selectedExpense.amount)}원
                  </p>
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  상태
                </label>
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    selectedExpense.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : selectedExpense.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : selectedExpense.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {selectedExpense.status === 'APPROVED'
                    ? '승인됨'
                    : selectedExpense.status === 'PENDING'
                    ? '승인 대기중'
                    : selectedExpense.status === 'REJECTED'
                    ? '반려됨'
                    : selectedExpense.status}
                </span>
              </div>

              {/* 반려 사유 */}
              {selectedExpense.status === 'REJECTED' && selectedExpense.rejectionReason && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-red-900 mb-2">
                    반려 사유
                  </label>
                  <p className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed">
                    {selectedExpense.rejectionReason}
                  </p>
                </div>
              )}

              {/* 지출 내역 설명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  지출 내역 설명
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {selectedExpense.description}
                  </p>
                </div>
              </div>

              {/* 영수증 */}
              {selectedExpense.receiptUrl && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    영수증
                  </label>
                  <a
                    href={`${import.meta.env.VITE_IMAGE_BASE_URL}${selectedExpense.receiptUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Eye size={18} />
                    영수증 보기
                  </a>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedExpense(null)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
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

      {/* 정산 요청 모달 */}
      {isSettlementModalOpen && (
        <SettlementRequestModal
          onClose={() => setIsSettlementModalOpen(false)}
          onSuccess={() => {
            setIsSettlementModalOpen(false);
            refetch();
          }}
          projectId={piggyBank.projectId}
          projectTitle={piggyBank.projectTitle}
          totalAmount={piggyBank.totalAmount}
        />
      )}
    </div>
  );
};

export default PiggyBankManagementPage;
