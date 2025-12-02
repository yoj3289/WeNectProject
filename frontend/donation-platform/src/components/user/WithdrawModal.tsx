import React, { useState } from 'react';
import { X, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onConfirm, isLoading = false }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm(password, reason);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <h2 className="text-lg font-bold text-stone-800">회원 탈퇴</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5">
          {/* 경고 박스 */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <h3 className="font-bold text-red-800 mb-2 text-sm">탈퇴 시 유의사항</h3>
            <ul className="text-sm text-red-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                회원 탈퇴 시 30일간 계정이 유예됩니다.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                30일 이내 로그인 시 탈퇴를 취소할 수 있습니다.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                30일 후 모든 데이터가 영구적으로 삭제됩니다.
              </li>
            </ul>
          </div>

          {/* 비밀번호 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-2">비밀번호 확인</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-12 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 탈퇴 사유 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              탈퇴 사유 <span className="text-stone-400 font-normal">(선택)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="탈퇴 사유를 입력해주세요"
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-all disabled:opacity-50"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl font-semibold text-stone-700 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !password}
              className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  처리 중...
                </>
              ) : (
                '탈퇴하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
