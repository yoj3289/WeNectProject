import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Wallet, AlertCircle, Calendar, Tag, FileText, Upload } from 'lucide-react';
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
      toast.error('영수증 파일을 첨부해주세요.');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('지출 금액을 입력해주세요.');
      return;
    }

    if (formData.amount > currentBalance) {
      toast.error(`저금통 잔액이 부족합니다. 현재 잔액: ${currentBalance.toLocaleString()}원`);
      return;
    }

    if (!formData.category.trim()) {
      toast.error('지출 카테고리를 선택해주세요.');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('지출 내역 설명을 입력해주세요.');
      return;
    }

    try {
      const requestData = formData;

      await withdrawMutation.mutateAsync({
        piggyId,
        data: requestData,
        receiptFile,
      });

      toast.success('지출 내역이 등록되었습니다. 관리자 승인 후 저금통에서 차감됩니다.');
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
      toast.error(error.message || '지출 내역 등록에 실패했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB 이하여야 합니다.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">지출 내역 등록</h2>
            <p className="text-sm text-gray-600 mt-1">지출 정보를 입력하고 영수증을 첨부하세요</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* 프로젝트 & 잔액 정보 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-800">{projectTitle}</h3>
              <div className="bg-white rounded-lg p-6 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Wallet size={18} className="text-blue-500" />
                    현재 잔액
                  </span>
                  <span className="text-3xl font-bold text-blue-600">{currentBalance.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 안내 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-600" />
                안내사항
              </h4>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>등록하신 지출 내역은 관리자 승인 후 저금통에서 차감됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>영수증은 필수 첨부 항목입니다.</span>
                </li>
              </ul>
            </div>

            {/* 지출 금액 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Wallet size={20} className="text-orange-500" />
                지출 금액 <span className="text-red-500 text-sm">*</span>
              </h4>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                min="0"
                max={currentBalance}
                placeholder="0"
                required
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setQuickAmount(100000)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  +10만
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(500000)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  +50만
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(1000000)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  +100만
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAmount(currentBalance)}
                  className="flex-1 px-3 py-2 text-sm bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200 font-medium"
                >
                  전액
                </button>
              </div>
            </div>

            {/* 지출 날짜 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-green-500" />
                지출 날짜 <span className="text-red-500 text-sm">*</span>
              </h4>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) =>
                  setFormData({ ...formData, expenseDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* 지출 카테고리 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Tag size={20} className="text-blue-500" />
                지출 카테고리 <span className="text-red-500 text-sm">*</span>
              </h4>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 식비, 교통비, 물품구입, 인건비 등"
                maxLength={50}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                간단한 카테고리명을 입력하세요 (최대 50자)
              </p>
            </div>

            {/* 지출 내역 설명 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-purple-500" />
                지출 내역 설명 <span className="text-red-500 text-sm">*</span>
              </h4>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="이 지출이 어디에 사용되었는지 상세히 작성해주세요.&#10;예: 급식 재료 구매 (쌀 20kg, 채소류), 복지관 난방비 12월분 등"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                지출 용도를 구체적으로 작성해주세요.
              </p>
            </div>

            {/* 영수증 첨부 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={20} className="text-red-500" />
                영수증 첨부 <span className="text-red-500 text-sm">*</span>
              </h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                  id="receipt-upload"
                  required
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">클릭하여 파일을 선택하세요</p>
                  <p className="text-xs text-gray-500">이미지 또는 PDF 파일 (최대 10MB)</p>
                </label>
              </div>
              {receiptFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <FileText size={20} className="text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{receiptFile.name}</p>
                    <p className="text-xs text-gray-500">{(receiptFile.size / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50"
            >
              {withdrawMutation.isPending ? '처리 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
