import React, { useState } from 'react';
import { Receipt, Calendar, FileText, Eye, X, Wallet } from 'lucide-react';
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
    return dateString;
  };

  // 총 지출 금액 계산 (APPROVED만)
  const totalAmount = expenses
    .filter(expense => expense.status === 'APPROVED')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const approvedCount = expenses.filter(expense => expense.status === 'APPROVED').length;

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
        return 'bg-stone-100 text-stone-700';
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
        <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
          <Receipt className="text-stone-300" size={32} />
        </div>
        <p className="text-lg font-medium text-stone-600">등록된 지출 내역이 없습니다</p>
        <p className="text-sm text-stone-400 mt-2">기관에서 지출 내역을 등록하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 지출 요약 - SettlementSummaryTab 스타일 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-amber-600" />
          <span className="text-sm text-stone-600">총 지출 금액</span>
        </div>
        <p className="text-3xl font-bold text-amber-600">
          {formatAmount(totalAmount)}원
        </p>
        <p className="text-sm text-stone-500 mt-1">
          {approvedCount}건의 승인된 지출
        </p>
      </div>

      {/* 지출 내역 리스트 - 카드 스타일 */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* 헤더 - SettlementSummaryTab과 동일한 스타일 */}
        <div className="bg-stone-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <h4 className="text-lg font-bold text-white">지출 내역 상세</h4>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.expenseId}
              className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* 날짜 */}
                <div className="flex items-center gap-1.5 text-stone-500 flex-shrink-0">
                  <Calendar size={14} />
                  <span className="text-sm">{formatDate(expense.expenseDate)}</span>
                </div>

                {/* 카테고리 */}
                <span className="px-2.5 py-1 bg-stone-200 text-stone-700 rounded-lg text-xs font-medium truncate max-w-[120px]" title={expense.category}>
                  {expense.category}
                </span>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {/* 금액 */}
                <span className="font-bold text-amber-600">
                  {formatAmount(expense.amount)}원
                </span>

                {/* 상태 */}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadge(expense.status)}`}>
                  {getStatusLabel(expense.status)}
                </span>

                {/* 상세보기 버튼 */}
                <button
                  onClick={() => setSelectedExpense(expense)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Eye size={14} />
                  상세
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 지출 상세 모달 */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Receipt className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">지출 상세 정보</h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(selectedExpense.expenseDate)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="p-2 hover:bg-stone-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-5">
              {/* 지출 금액 - 강조 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-stone-600 mb-1">지출 금액</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatAmount(selectedExpense.amount)}원
                </p>
              </div>

              {/* 카테고리 & 상태 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">카테고리</p>
                  <p className="text-sm font-medium text-stone-800">{selectedExpense.category}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">상태</p>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadge(selectedExpense.status)}`}>
                    {getStatusLabel(selectedExpense.status)}
                  </span>
                </div>
              </div>

              {/* 반려 사유 */}
              {selectedExpense.status === 'REJECTED' && selectedExpense.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">반려 사유</p>
                  <p className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed">
                    {selectedExpense.rejectionReason}
                  </p>
                </div>
              )}

              {/* 지출 내역 설명 */}
              <div>
                <p className="text-sm font-medium text-stone-700 mb-2">지출 내역 설명</p>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {selectedExpense.description}
                  </p>
                </div>
              </div>

              {/* 영수증 */}
              {selectedExpense.receiptUrl && (
                <div>
                  <p className="text-sm font-medium text-stone-700 mb-2">영수증</p>
                  <a
                    href={`${import.meta.env.VITE_IMAGE_BASE_URL}${selectedExpense.receiptUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    <Eye size={16} />
                    영수증 보기
                  </a>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200">
              <button
                onClick={() => setSelectedExpense(null)}
                className="w-full px-4 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
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
