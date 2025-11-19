import React from 'react';
import { X, Download, ZoomIn, ZoomOut, Calendar, FileText } from 'lucide-react';
import type { Expense } from '../../types';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

interface ReceiptViewerProps {
  expense: Expense;
  onClose: () => void;
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ expense, onClose }) => {
  const [zoom, setZoom] = React.useState(100);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    // 실제로는 다운로드 API 호출
    window.open(`${IMAGE_BASE_URL}${expense.receiptUrl}`, '_blank');
  };

  // ESC 키로 모달 닫기
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                영수증 상세
              </h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{expense.expenseDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>{expense.category}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* 지출 정보 */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">지출 내역</p>
                <p className="font-semibold text-gray-900">{expense.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">금액</p>
                <p className="text-xl font-bold text-green-600">
                  {formatAmount(expense.amount)}원
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 툴바 */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="축소"
            >
              <ZoomOut size={20} className="text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="확대"
            >
              <ZoomIn size={20} className="text-gray-600" />
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <Download size={18} />
            <span className="hidden sm:inline">다운로드</span>
          </button>
        </div>

        {/* 이미지 뷰어 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={`${IMAGE_BASE_URL}${expense.receiptUrl}`}
              alt={`${expense.description} 영수증`}
              className="max-w-full h-auto rounded-lg shadow-lg transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})` }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              등록일: {expense.createdAt}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
