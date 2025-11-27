import React, { useState } from 'react';
import { Receipt, Calendar, FileText, Eye, X } from 'lucide-react';
import type { Expense } from '../../types';

interface ExpenseListTabProps {
  expenses: Expense[];
  onReceiptClick: (expense: Expense) => void;
}

const ExpenseListTab: React.FC<ExpenseListTabProps> = ({ expenses, onReceiptClick }) => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string): string => {
    return dateString; // 이미 포맷된 문자열이라고 가정
  };

  // 총 지출 금액 계산 (APPROVED만)
  const totalAmount = expenses
    .filter(expense => expense.status === 'APPROVED')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // 상태 표시 함수
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '승인됨';
      case 'PENDING':
        return '대기중';
      case 'REJECTED':
        return '반려됨';
      default:
        return status;
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <Receipt className="mx-auto mb-4 text-gray-300" size={64} />
        <p className="text-lg font-semibold text-gray-500">등록된 지출 내역이 없습니다</p>
        <p className="text-sm text-gray-400 mt-2">기관에서 지출 내역을 등록하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 지출 요약 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="text-green-600" size={24} />
          <p className="text-sm text-gray-600">총 지출 금액</p>
        </div>
        <p className="text-3xl font-bold text-green-600">
          {formatAmount(totalAmount)}원
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {expenses.length}건의 지출
        </p>
      </div>

      {/* 지출 내역 테이블 (모바일 대응) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <FileText size={20} />
            지출 내역 상세
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[110px] md:w-auto">
                  날짜
                </th>
                <th className="text-left py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap">
                  카테고리
                </th>
                <th className="text-right py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[120px] md:w-auto">
                  금액
                </th>
                <th className="text-center py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[80px] md:w-auto">
                  상태
                </th>
                <th className="text-center py-3 px-3 md:px-4 font-semibold text-gray-700 whitespace-nowrap w-[100px] md:w-auto">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
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
                    <span className={`px-2 py-0.5 md:py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusBadge(expense.status)}`}>
                      {getStatusLabel(expense.status)}
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
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${getStatusBadge(selectedExpense.status)} border ${
                    selectedExpense.status === 'APPROVED'
                      ? 'border-green-300'
                      : selectedExpense.status === 'PENDING'
                      ? 'border-yellow-300'
                      : selectedExpense.status === 'REJECTED'
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                >
                  {getStatusLabel(selectedExpense.status)}
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
    </div>
  );
};

export default ExpenseListTab;
