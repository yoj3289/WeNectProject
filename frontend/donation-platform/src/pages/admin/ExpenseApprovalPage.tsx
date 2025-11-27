import React, { useState } from 'react';
import { Calendar, DollarSign, FileText, CheckCircle, XCircle, Eye, Loader2, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExpensesByStatus, useApproveExpense, useRejectExpense } from '../../hooks/useExpenses';
import type { Expense } from '../../types';
import ConfirmModal from '../../components/common/ConfirmModal';

/**
 * 관리자 지출 승인 관리 페이지
 */
const ExpenseApprovalPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingApproveId, setPendingApproveId] = useState<number | null>(null);

  // API: 상태별 지출 내역 조회
  const { data: expenses = [], isLoading, refetch } = useExpensesByStatus(selectedStatus);

  // API: 지출 승인
  const approveMutation = useApproveExpense();

  // API: 지출 반려
  const rejectMutation = useRejectExpense();

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
      refetch();
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
      refetch();
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

  return (
    <div className="p-8 space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">지출 승인 관리</h1>
        <p className="text-sm text-gray-600 mt-1">기관의 지출 요청을 검토하고 승인/반려합니다</p>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 font-semibold transition-colors ${
              selectedStatus === status
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {getStatusLabel(status)}
            {status === 'PENDING' && expenses.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {expenses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 지출 목록 */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">지출 내역을 불러오는 중...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{getStatusLabel(selectedStatus)} 상태의 지출 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">날짜</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">프로젝트 ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">카테고리</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">금액</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">상태</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.expenseId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{formatDate(expense.expenseDate)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600">#{expense.projectId}</span>
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
                        {selectedStatus === 'PENDING' && (
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
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">지출 상세 내역</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedExpense(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">프로젝트 ID</p>
                  <p className="font-mono text-gray-900">#{selectedExpense.projectId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">지출일</p>
                  <p className="text-gray-900">{formatDate(selectedExpense.expenseDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">카테고리</p>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                    {selectedExpense.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">금액</p>
                  <p className="font-bold text-orange-600 text-lg">{formatAmount(selectedExpense.amount)}원</p>
                </div>
              </div>

              {/* 상태 */}
              <div>
                <p className="text-sm text-gray-500 mb-1">상태</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedExpense.status)}`}>
                  {getStatusLabel(selectedExpense.status)}
                </span>
              </div>

              {/* 설명 */}
              <div>
                <p className="text-sm text-gray-500 mb-1">설명</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedExpense.description || '-'}
                </p>
              </div>

              {/* 영수증 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">영수증</p>
                {selectedExpense.receiptUrl ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL}${selectedExpense.receiptUrl}`}
                      alt="영수증"
                      className="w-full max-h-80 object-contain bg-gray-50"
                    />
                    <a
                      href={`${import.meta.env.VITE_IMAGE_BASE_URL}${selectedExpense.receiptUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2 text-center text-blue-600 hover:bg-blue-50 border-t border-gray-200"
                    >
                      새 탭에서 보기
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-400 bg-gray-50 p-3 rounded-lg text-center">영수증 없음</p>
                )}
              </div>

              {/* 반려 사유 (반려된 경우) */}
              {selectedExpense.status === 'REJECTED' && selectedExpense.rejectionReason && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">반려 사유</p>
                  <p className="text-red-600 bg-red-50 p-3 rounded-lg">
                    {selectedExpense.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-6 flex gap-3">
              {selectedExpense.status === 'PENDING' ? (
                <>
                  <button
                    onClick={() => handleApprove(selectedExpense.expenseId)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    {approveMutation.isPending ? '처리 중...' : '승인'}
                  </button>
                  <button
                    onClick={() => handleRejectClick(selectedExpense)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    반려
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedExpense(null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  닫기
                </button>
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
