import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Wallet, Building, CreditCard, User, Trash2, File, Image, FileType } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateSettlement } from '../../hooks/useSettlements';

interface SettlementRequestModalProps {
  projectId: number;
  projectTitle: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 정산 요청 모달
 * - 입금 계좌 정보 입력
 * - 증빙 서류 첨부 (최대 10개, 각 10MB 이하)
 */
export const SettlementRequestModal: React.FC<SettlementRequestModalProps> = ({
  projectId,
  projectTitle,
  totalAmount,
  onClose,
  onSuccess
}) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSettlement = useCreateSettlement();

  const formatAmount = (amount: number) => {
    return Math.floor(amount).toLocaleString('ko-KR');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > 10) {
      toast.error('최대 10개의 파일만 첨부할 수 있습니다.');
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: 파일 크기는 10MB 이하여야 합니다.`);
        return false;
      }
      return true;
    });

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const filteredFiles = validFiles.filter(file => {
      const isAllowed = allowedTypes.some(type => file.type === type) ||
        ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'].some(ext => file.name.toLowerCase().endsWith(ext));
      if (!isAllowed) {
        toast.error(`${file.name}: 지원하지 않는 파일 형식입니다.`);
      }
      return isAllowed;
    });

    setFiles(prev => [...prev, ...filteredFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image size={16} className="text-blue-500" />;
    }
    if (ext === 'pdf') {
      return <FileType size={16} className="text-red-500" />;
    }
    return <File size={16} className="text-stone-500" />;
  };

  const handleSubmit = async () => {
    if (!bankName.trim()) {
      toast.error('은행명을 입력해주세요.');
      return;
    }
    if (!accountNumber.trim()) {
      toast.error('계좌번호를 입력해주세요.');
      return;
    }
    if (!accountHolder.trim()) {
      toast.error('예금주명을 입력해주세요.');
      return;
    }

    try {
      await createSettlement.mutateAsync({
        data: {
          projectId,
          settlementAmount: totalAmount,
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
        },
        documents: files
      });
      toast.success('정산 요청이 완료되었습니다.');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '정산 요청에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  const isFormValid = bankName.trim() && accountNumber.trim() && accountHolder.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 헤더 - 다크 스타일 */}
        <div className="bg-stone-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">정산 요청</h2>
                <p className="text-sm text-stone-400">프로젝트 정산을 신청합니다</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
            >
              <X size={20} className="text-stone-400" />
            </button>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 프로젝트 정보 카드 */}
          <div className="bg-amber-500 px-6 py-5">
            <p className="text-amber-100 text-sm mb-1">정산 대상 프로젝트</p>
            <h3 className="text-white font-medium text-lg mb-4 line-clamp-1">{projectTitle}</h3>
            <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-white" />
                  <span className="text-white/90 text-sm">정산 신청 금액</span>
                </div>
                <span className="text-white text-xl font-bold">{formatAmount(totalAmount)}원</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* STEP 1: 계좌 정보 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <h4 className="font-medium text-stone-800">입금 계좌 정보</h4>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-stone-600 mb-1.5">
                    <Building size={14} />
                    은행명
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="예: 국민은행"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm text-stone-600 mb-1.5">
                    <CreditCard size={14} />
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="예: 123-456-789012"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm text-stone-600 mb-1.5">
                    <User size={14} />
                    예금주명
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="예: 사단법인 희망나눔"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: 증빙 서류 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <h4 className="font-medium text-stone-800">증빙 서류 첨부</h4>
                <span className="text-xs text-stone-500">(선택)</span>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                {/* 파일 업로드 영역 */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-b border-dashed border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Upload size={24} className="text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-600 mb-1">
                      클릭하여 파일을 선택하세요
                    </p>
                    <p className="text-xs text-stone-400">
                      PDF, JPG, PNG, DOC, DOCX (최대 10개, 각 10MB)
                    </p>
                  </div>
                </div>

                {/* 첨부된 파일 목록 */}
                {files.length > 0 && (
                  <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-stone-200">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-stone-700 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-stone-400">
                              {(file.size / 1024 / 1024).toFixed(2)}MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length === 0 && (
                  <div className="px-4 py-3 bg-stone-50 text-center">
                    <p className="text-xs text-stone-500">첨부된 파일이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="bg-white border-t border-stone-200 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-stone-600 rounded-xl font-medium hover:bg-stone-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={createSettlement.isPending || !isFormValid}
              className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {createSettlement.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  요청 중...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  정산 요청
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-stone-500 text-center mt-3">
            정산 요청 후 관리자 승인 시 저금통이 생성됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettlementRequestModal;
