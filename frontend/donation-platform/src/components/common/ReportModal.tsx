import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateReport } from '../../hooks/useReports';
import type { ReportType, ReportReason } from '../../api/reports';
import { REPORT_REASON_LABELS, REPORT_TYPE_LABELS } from '../../api/reports';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemType: ReportType;
  itemTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemTitle,
}) => {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');

  const createReportMutation = useCreateReport();

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('신고 사유를 선택해주세요.');
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        reportedItemId: itemId,
        reportType: itemType,
        reason: reason,
        description: description.trim() || undefined,
      });

      toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      onClose();
      setReason('');
      setDescription('');
    } catch (error: any) {
      const message = error.response?.data?.message || '신고 접수 중 오류가 발생했습니다.';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  const reportReasons: ReportReason[] = [
    'INAPPROPRIATE_CONTENT',
    'SPAM',
    'HARASSMENT',
    'FRAUD',
    'COPYRIGHT',
    'PERSONAL_INFO',
    'OTHER',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className="bg-stone-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Flag className="text-red-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">신고하기</h2>
                <p className="text-stone-400 text-sm">
                  {REPORT_TYPE_LABELS[itemType]} 신고
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 신고 대상 정보 */}
          {itemTitle && (
            <div className="mb-6 p-4 bg-stone-50 rounded-xl">
              <p className="text-xs text-stone-500 mb-1">신고 대상</p>
              <p className="text-sm font-medium text-stone-900 line-clamp-2">{itemTitle}</p>
            </div>
          )}

          {/* 주의 문구 */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">신고 전 확인해주세요</p>
                <p className="text-amber-700">
                  허위 신고 시 제재를 받을 수 있습니다. 신중하게 신고해주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 신고 사유 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              신고 사유 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {reportReasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                    reason === r
                      ? 'bg-amber-50 border-2 border-amber-500'
                      : 'bg-stone-50 border-2 border-transparent hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      reason === r ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                    }`}
                  >
                    {reason === r && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm ${reason === r ? 'text-stone-900 font-medium' : 'text-stone-600'}`}>
                    {REPORT_REASON_LABELS[r]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              상세 설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="신고 사유에 대해 상세히 설명해주세요..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-all"
            />
            <p className="text-xs text-stone-400 mt-1 text-right">{description.length}/500</p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={createReportMutation.isPending}
              className="flex-1 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl font-medium text-stone-700 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || createReportMutation.isPending}
              className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createReportMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  신고 중...
                </>
              ) : (
                '신고하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
