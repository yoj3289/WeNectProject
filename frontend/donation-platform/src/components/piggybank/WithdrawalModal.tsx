import React, { useState } from 'react';
import { useWithdrawFromPiggyBank } from '../../hooks/usePiggyBanks';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  piggyId: number;
  projectTitle: string;
  currentBalance: number;
}

export function WithdrawalModal({
  isOpen,
  onClose,
  piggyId,
  projectTitle,
  currentBalance,
}: WithdrawalModalProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    category: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const withdrawMutation = useWithdrawFromPiggyBank();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiptFile) {
      alert('영수증 파일을 첨부해주세요.');
      return;
    }

    if (formData.amount <= 0) {
      alert('지출 금액을 입력해주세요.');
      return;
    }

    if (formData.amount > currentBalance) {
      alert(`저금통 잔액이 부족합니다. 현재 잔액: ${currentBalance.toLocaleString()}원`);
      return;
    }

    if (!formData.category.trim()) {
      alert('지출 카테고리를 선택해주세요.');
      return;
    }

    if (!formData.description.trim()) {
      alert('지출 내역 설명을 입력해주세요.');
      return;
    }

    try {
      const requestData = formData;

      await withdrawMutation.mutateAsync({
        piggyId,
        data: requestData,
        receiptFile,
      });

      alert('지출 내역이 등록되었습니다. 관리자 승인 후 저금통에서 차감됩니다.');
      onClose();

      // 폼 초기화
      setFormData({
        amount: 0,
        category: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
      });
      setReceiptFile(null);
    } catch (error: any) {
      alert(error.message || '지출 내역 등록에 실패했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setReceiptFile(file);
    }
  };

  const setQuickAmount = (amount: number) => {
    setFormData({ ...formData, amount: Math.min(amount, currentBalance) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">지출 내역 등록</h2>

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800 font-semibold mb-2">💡 안내</p>
          <p className="text-xs text-yellow-700">
            등록하신 지출 내역은 관리자 승인 후 저금통에서 차감됩니다.
          </p>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">프로젝트</p>
          <p className="font-semibold">{projectTitle}</p>
          <p className="text-sm text-gray-600 mt-2">현재 잔액</p>
          <p className="text-xl font-bold text-blue-600">
            {currentBalance.toLocaleString()}원
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 지출 금액 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              지출 금액 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              max={currentBalance}
              required
            />

            {/* 빠른 금액 선택 버튼 */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setQuickAmount(100000)}
                className="flex-1 px-2 py-1 text-sm border rounded hover:bg-gray-50"
              >
                +10만
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(500000)}
                className="flex-1 px-2 py-1 text-sm border rounded hover:bg-gray-50"
              >
                +50만
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(1000000)}
                className="flex-1 px-2 py-1 text-sm border rounded hover:bg-gray-50"
              >
                +100만
              </button>
              <button
                type="button"
                onClick={() => setQuickAmount(currentBalance)}
                className="flex-1 px-2 py-1 text-sm border rounded hover:bg-gray-50"
              >
                전액
              </button>
            </div>
          </div>

          {/* 지출 날짜 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              지출 날짜 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) =>
                setFormData({ ...formData, expenseDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 지출 카테고리 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              지출 카테고리 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="예: 식비, 교통비, 물품구입, 인건비 등"
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              간단한 카테고리명을 입력하세요 (최대 50자)
            </p>
          </div>

          {/* 지출 내역 설명 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              지출 내역 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="이 지출이 어디에 사용되었는지 상세히 작성해주세요.&#10;예: 급식 재료 구매 (쌀 20kg, 채소류), 복지관 난방비 12월분 등"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              지출 용도를 구체적으로 작성해주세요.
            </p>
          </div>

          {/* 영수증 첨부 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              영수증 첨부 <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            {receiptFile && (
              <p className="text-sm text-gray-600 mt-2">
                첨부된 파일: {receiptFile.name} (
                {(receiptFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              이미지 또는 PDF 파일 (최대 10MB)
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {withdrawMutation.isPending ? '처리 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
