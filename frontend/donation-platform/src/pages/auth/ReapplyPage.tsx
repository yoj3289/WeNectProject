import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Loader2, AlertCircle, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/apiClient';

interface LocationState {
  user: {
    userId: number;
    email: string;
    userName: string;
    phone?: string;
    organizationName?: string;
    businessNumber?: string;
    representativeName?: string;
  };
  rejectionInfo: {
    rejectionReason: string;
    rejectionFields: string; // JSON string
    lastRejectedAt: string;
  };
}

const ReapplyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // 상태가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!state || !state.user || !state.rejectionInfo) {
      navigate('/login');
    }
  }, [state, navigate]);

  if (!state || !state.user || !state.rejectionInfo) {
    return null;
  }

  const rejectedFields: string[] = JSON.parse(state.rejectionInfo.rejectionFields || '[]');

  const [formData, setFormData] = useState({
    userName: state.user.userName || '',
    phone: state.user.phone || '',
    organizationName: state.user.organizationName || '',
    businessNumber: state.user.businessNumber || '',
    representativeName: state.user.representativeName || '',
    password: '',
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 기존 필드명과 새 필드명 모두 지원 (하위 호환성)
  const isFieldRejected = (fieldName: string) => {
    // 새 필드명 체크
    if (rejectedFields.includes(fieldName)) {
      return true;
    }
    // 기존 필드명 호환성
    const legacyMapping: Record<string, string[]> = {
      '기관명': ['담당자명', '기관명(User)', '기관명(Org)'],
    };
    const legacyFieldNames = legacyMapping[fieldName] || [];
    return legacyFieldNames.some(legacy => rejectedFields.includes(legacy));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 검증 (PDF, JPG, PNG만 허용)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('PDF, JPG, PNG 파일만 업로드 가능합니다.');
      return;
    }

    setUploadedFile(file);
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    // 필수 필드 확인
    if (!formData.userName || !formData.phone || !formData.organizationName ||
        !formData.businessNumber || !formData.representativeName || !formData.password) {
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 제출서류가 거부된 경우 파일 필수
    if (isFieldRejected('제출서류') && !uploadedFile) {
      setErrorMessage('제출서류를 다시 업로드해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // FormData 생성
      const submitData = new FormData();
      submitData.append('userId', state.user.userId.toString());
      submitData.append('userName', formData.userName);
      submitData.append('phone', formData.phone);
      submitData.append('organizationName', formData.organizationName);
      submitData.append('businessNumber', formData.businessNumber);
      submitData.append('representativeName', formData.representativeName);
      submitData.append('password', formData.password);

      if (uploadedFile) {
        submitData.append('file', uploadedFile);
      }

      // 재심사 요청 API 호출
      await apiClient.post('/organization/reapply', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 성공 시 로그인 페이지로 이동
      toast.success('재심사 요청이 완료되었습니다. 관리자의 승인을 기다려주세요.');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || '재심사 요청에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-white rounded-2xl p-12 w-full border border-gray-200 shadow-lg relative">
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 font-semibold"
          disabled={isSubmitting}
        >
          ← 로그인으로
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-red-500" size={40} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold mb-2">재심사 요청</h1>
          <p className="text-gray-600">승인 거부된 항목을 수정하여 다시 제출해주세요</p>
        </div>

        {/* 거부 사유 표시 */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">승인 거부 사유</h3>
              <p className="text-sm text-red-800 whitespace-pre-line">{state.rejectionInfo.rejectionReason}</p>
              {rejectedFields.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-red-900">수정이 필요한 항목:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {rejectedFields.map((field) => (
                      <span key={field} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800 whitespace-pre-line">{errorMessage}</p>
            </div>
          )}

          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              value={state.user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
          </div>

          {/* 기관명 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              기관명 <span className="text-red-500">*</span>
              {isFieldRejected('기관명') && <span className="text-red-500 ml-2 text-xs">(수정 필요)</span>}
            </label>
            <input
              type="text"
              placeholder="사회복지법인 OOO"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value, organizationName: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                isFieldRejected('기관명') ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-red-500'
              }`}
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              연락처 <span className="text-red-500">*</span>
              {isFieldRejected('연락처') && <span className="text-red-500 ml-2 text-xs">(수정 필요)</span>}
            </label>
            <input
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                isFieldRejected('연락처') ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-red-500'
              }`}
            />
          </div>

          {/* 사업자번호 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              사업자번호 <span className="text-red-500">*</span>
              {isFieldRejected('사업자번호') && <span className="text-red-500 ml-2 text-xs">(수정 필요)</span>}
            </label>
            <input
              type="text"
              placeholder="123-45-67890"
              value={formData.businessNumber}
              onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                isFieldRejected('사업자번호') ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-red-500'
              }`}
            />
          </div>

          {/* 대표자명 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              대표자명 <span className="text-red-500">*</span>
              {isFieldRejected('대표자명') && <span className="text-red-500 ml-2 text-xs">(수정 필요)</span>}
            </label>
            <input
              type="text"
              placeholder="김철수"
              value={formData.representativeName}
              onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                isFieldRejected('대표자명') ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-red-500'
              }`}
            />
          </div>

          {/* 제출서류 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              제출서류 (사업자등록증) {isFieldRejected('제출서류') && <span className="text-red-500">* (재제출 필요)</span>}
              {isFieldRejected('제출서류') && <span className="text-red-500 ml-2 text-xs">(수정 필요)</span>}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 ${
                isFieldRejected('제출서류') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-reapply"
                disabled={isSubmitting}
              />
              <label htmlFor="file-upload-reapply" className="cursor-pointer">
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                {uploadedFile ? (
                  <p className="text-sm text-green-600 font-semibold">{uploadedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">클릭하여 파일 선택</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (최대 5MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="본인 확인을 위해 비밀번호를 입력하세요"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">재심사 요청을 위해 현재 비밀번호를 입력해주세요.</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>제출 중...</span>
              </>
            ) : (
              '재심사 요청'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReapplyPage;
