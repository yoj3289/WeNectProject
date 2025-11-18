import React, { useState } from 'react';
import { Receipt, Calendar, FileText, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import type { Expense } from '../../types';

interface ExpenseListTabProps {
  expenses: Expense[];
  onReceiptClick: (expense: Expense) => void;
}

const ExpenseListTab: React.FC<ExpenseListTabProps> = ({ expenses, onReceiptClick }) => {
  const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string): string => {
    return dateString; // 이미 포맷된 문자열이라고 가정
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      '의료비': 'bg-red-100 text-red-700',
      '장비구매': 'bg-blue-100 text-blue-700',
      '운영비': 'bg-green-100 text-green-700',
      '급식비': 'bg-orange-100 text-orange-700',
      '교육비': 'bg-purple-100 text-purple-700',
      '기타': 'bg-gray-100 text-gray-700',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-700';
  };

  // 총 지출 금액 계산
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 카테고리별 통계
  const categoryStats = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = { count: 0, amount: 0 };
    }
    acc[category].count += 1;
    acc[category].amount += expense.amount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const toggleExpand = (expenseId: number) => {
    setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 총 지출 */}
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

        {/* 카테고리별 요약 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-3 font-semibold">카테고리별 지출</p>
          <div className="space-y-2">
            {Object.entries(categoryStats)
              .sort((a, b) => b[1].amount - a[1].amount)
              .slice(0, 3)
              .map(([category, stats]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatAmount(stats.amount)}원
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 지출 내역 테이블 (모바일 대응) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <FileText size={20} />
            지출 내역 상세
          </h4>
        </div>

        {/* 데스크톱 테이블 뷰 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  내역
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  영수증
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.expenseId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar size={16} className="text-gray-400" />
                      {formatDate(expense.expenseDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {expense.description}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatAmount(expense.amount)}원
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => onReceiptClick(expense)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      <ImageIcon size={16} />
                      보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 뷰 */}
        <div className="md:hidden divide-y divide-gray-200">
          {expenses.map((expense) => (
            <div key={expense.expenseId} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(expense.expenseDate)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">
                    {expense.description}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(expense.amount)}원
                  </p>
                </div>
                <button
                  onClick={() => toggleExpand(expense.expenseId)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {expandedExpenseId === expense.expenseId ? (
                    <ChevronUp size={20} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-600" />
                  )}
                </button>
              </div>

              {/* 확장 영역 */}
              {expandedExpenseId === expense.expenseId && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => onReceiptClick(expense)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    <ImageIcon size={18} />
                    영수증 보기
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리별 통계 차트 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-bold text-lg mb-4">카테고리별 지출 분포</h4>
        <div className="space-y-3">
          {Object.entries(categoryStats)
            .sort((a, b) => b[1].amount - a[1].amount)
            .map(([category, stats]) => {
              const percentage = Math.round((stats.amount / totalAmount) * 100);
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm px-3 py-1 rounded ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatAmount(stats.amount)}원
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ExpenseListTab;
