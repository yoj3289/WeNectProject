import React, { useState } from 'react';
import { X, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateSettlement } from '../../hooks/useSettlements';
import type { CreateSettlementRequest } from '../../api/settlements';

interface Props {
  projectId: number;
  projectTitle: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function SettlementRequestModal({
  projectId,
  projectTitle,
  totalAmount,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<CreateSettlementRequest>({
    projectId,
    settlementAmount: totalAmount,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const createSettlement = useCreateSettlement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
      toast.error('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 계좌번호 형식 검증 (숫자만, 10~14자리)
    const cleanAccountNumber = formData.accountNumber.replace(/-/g, '');
    if (!/^\d{10,14}$/.test(cleanAccountNumber)) {
      toast.error('올바른 계좌번호 형식이 아닙니다. (10~14자리 숫자)');
    return;
    }

    if (documents.length === 0) {
      toast.error('증빙 서류를 최소 1개 이상 첨부해주세요.');
      return;
    }

    try {
      await createSettlement.mutateAsync({ data: formData, documents });
      toast.success('정산 요청이 완료되었습니다.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || '정산 요청에 실패했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (documents.length + files.length > 10) {
      toast.error('서류는 최대 10개까지 첨부 가능합니다.');
      return;
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 파일 크기가 10MB를 초과합니다.`);
        return;
      }
    }

    setDocuments([...documents, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">정산 요청</h2>
              <p className="text-sm text-gray-600 mt-1">프로젝트 정산을 신청합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={createSettlement.isPending}
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 프로젝트 정보 카드 */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-5 rounded-xl mb-6 border border-green-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">프로젝트</p>
                <p className="font-bold text-lg text-gray-900 mb-3">{projectTitle}</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">정산 신청 금액</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totalAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                모금액 전액을 정산 요청합니다. 승인 후 저금통에서 관리됩니다.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 계좌 정보 섹션 */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} />
                입금 계좌 정보
              </h3>

              {/* 은행명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  은행명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="예: 국민은행"
                  required
                />
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="예: 123-456-789012"
                  required
                />
              </div>

              {/* 예금주 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예금주명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="예: 사단법인 희망나눔"
                  required
                />
              </div>
            </div>

            {/* 서류 첨부 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                증빙 서류 첨부 <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full"
                  id="file-upload"
                />
                <div className="flex items-start gap-2 mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
                  <p>
                    최대 <span className="font-semibold">10개</span> 파일, 각 <span className="font-semibold">10MB</span> 이하<br/>
                    허용 형식: PDF, JPG, PNG, DOC, DOCX
                  </p>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">첨부된 파일 ({documents.length}개)</p>
                  {documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3 rounded-lg hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText size={18} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="ml-3 text-red-600 hover:text-red-800 text-sm font-medium flex-shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
              disabled={createSettlement.isPending}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={createSettlement.isPending}
            >
              {createSettlement.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  요청 중...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  정산 요청 제출
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            정산 요청 후 관리자 승인 시 저금통이 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
