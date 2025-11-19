import React, { useState } from 'react';
import { Image as ImageIcon, Calendar, FileText } from 'lucide-react';
import type { Expense } from '../../types';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

interface ReceiptGalleryTabProps {
  expenses: Expense[];
  onReceiptClick: (expense: Expense) => void;
}

const ReceiptGalleryTab: React.FC<ReceiptGalleryTabProps> = ({ expenses, onReceiptClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  // 카테고리 목록 추출
  const categories = ['전체', ...Array.from(new Set(expenses.map(e => e.category)))];

  // 필터링된 지출 내역
  const filteredExpenses = selectedCategory === '전체'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  // 카테고리별 색상
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      '의료비': 'bg-red-100 text-red-700 border-red-300',
      '장비구매': 'bg-blue-100 text-blue-700 border-blue-300',
      '운영비': 'bg-green-100 text-green-700 border-green-300',
      '급식비': 'bg-orange-100 text-orange-700 border-orange-300',
      '교육비': 'bg-purple-100 text-purple-700 border-purple-300',
      '기타': 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <ImageIcon className="mx-auto mb-4 text-gray-300" size={64} />
        <p className="text-lg font-semibold text-gray-500">등록된 영수증이 없습니다</p>
        <p className="text-sm text-gray-400 mt-2">기관에서 영수증을 등록하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">영수증 갤러리</h3>
          <p className="text-sm text-gray-600 mt-1">
            총 {filteredExpenses.length}개의 영수증
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                selectedCategory === category
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 영수증 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredExpenses.map((expense) => (
          <div
            key={expense.expenseId}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => onReceiptClick(expense)}
          >
            {/* 썸네일 이미지 */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={`${IMAGE_BASE_URL}${expense.receiptThumbnailUrl || expense.receiptUrl}`}
                alt={expense.description}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white rounded-full p-3">
                    <ImageIcon size={24} className="text-gray-700" />
                  </div>
                </div>
              </div>

              {/* 카테고리 뱃지 */}
              <div className="absolute top-3 left-3">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getCategoryColor(expense.category)}`}>
                  {expense.category}
                </span>
              </div>
            </div>

            {/* 정보 */}
            <div className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{expense.expenseDate}</p>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {expense.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">지출 금액</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(expense.amount)}원
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 결과 */}
      {filteredExpenses.length === 0 && (
        <div className="text-center py-16">
          <ImageIcon className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-lg font-semibold text-gray-500">
            {selectedCategory} 카테고리의 영수증이 없습니다
          </p>
          <button
            onClick={() => setSelectedCategory('전체')}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            전체 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiptGalleryTab;
