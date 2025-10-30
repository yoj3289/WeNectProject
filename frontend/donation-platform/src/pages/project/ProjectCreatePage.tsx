import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, Bold, Italic, List, AlignLeft, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useCreateProject } from '../../hooks/useProjects';

interface CreateProjectPageProps {
  onSubmit: () => void;
}

const CreateProjectPage: React.FC<CreateProjectPageProps> = ({
  onSubmit
}) => {
  const navigate = useNavigate();
  // 기본 정보
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // 목표 & 일정
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 상세 설명 (리치 텍스트)
  const [description, setDescription] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // 이미지
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  // 사용계획서
  const [planDocument, setPlanDocument] = useState<File | null>(null);

  // 현재 단계
  const [currentStep, setCurrentStep] = useState(1);

  // 에러 메시지
  const [errorMessage, setErrorMessage] = useState('');

  // API: 프로젝트 생성
  const createProjectMutation = useCreateProject();

  // 카테고리 옵션
  const categories = ['아동복지', '노인복지', '장애인복지', '동물보호', '환경보호', '교육'];

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 5) {
      setErrorMessage('이미지는 최대 5개까지 업로드 가능합니다.');
      return;
    }
    setUploadedImages([...uploadedImages, ...files]);
    setErrorMessage('');
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // 사용계획서 업로드
  const handlePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('PDF, DOC, DOCX 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setPlanDocument(file);
    setErrorMessage('');
  };

  // 리치 텍스트 에디터 - 볼드 토글
  const toggleBold = () => {
    document.execCommand('bold');
    setIsBold(!isBold);
  };

  // 리치 텍스트 에디터 - 이탤릭 토글
  const toggleItalic = () => {
    document.execCommand('italic');
    setIsItalic(!isItalic);
  };

  // 리치 텍스트 에디터 - 리스트 추가
  const insertList = () => {
    document.execCommand('insertUnorderedList');
  };

  // 리치 텍스트 에디터 - 제목 스타일
  const applyHeading = () => {
    document.execCommand('formatBlock', false, 'h3');
  };

  // 다음 단계
  const nextStep = () => {
    setErrorMessage('');

    if (currentStep === 1) {
      if (!projectTitle || !projectCategory || !organizationName) {
        setErrorMessage('모든 필수 항목을 입력해주세요.');
        return;
      }
    } else if (currentStep === 2) {
      if (!targetAmount || !startDate || !endDate) {
        setErrorMessage('모든 필수 항목을 입력해주세요.');
        return;
      }
      if (Number(targetAmount) < 1000000) {
        setErrorMessage('목표 금액은 최소 100만원 이상이어야 합니다.');
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        setErrorMessage('종료일은 시작일보다 이후여야 합니다.');
        return;
      }
    } else if (currentStep === 3) {
      if (!description.trim()) {
        setErrorMessage('프로젝트 상세 설명을 입력해주세요.');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  // 이전 단계
  const prevStep = () => {
    setErrorMessage('');
    setCurrentStep(currentStep - 1);
  };

  // 제출
  const handleSubmit = async () => {
    if (!planDocument) {
      if (!confirm('사용계획서를 업로드하지 않았습니다. 계속 진행하시겠습니까?')) {
        return;
      }
    }

    try {
      setErrorMessage('');

      // FormData 생성
      const formData = new FormData();
      formData.append('title', projectTitle);
      formData.append('category', projectCategory);
      formData.append('organization', organizationName);
      formData.append('targetAmount', targetAmount);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('description', description);

      // 이미지 추가
      uploadedImages.forEach((image, index) => {
        formData.append(`images`, image);
      });

      // 사용계획서 추가
      if (planDocument) {
        formData.append('planDocument', planDocument);
      }

      // API 호출
      await createProjectMutation.mutateAsync(formData);

      alert('프로젝트 등록이 완료되었습니다!\n관리자 승인 후 게시됩니다.');
      onSubmit();
    } catch (error: any) {
      const message = error.response?.data?.message || '프로젝트 등록에 실패했습니다.';
      setErrorMessage(message);
    }
  };

  // 단계별 렌더링
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                프로젝트명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="따뜻한 겨울나기 프로젝트"
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">선택해주세요</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                기관명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="희망재단"
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                목표 금액 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="10000000"
                  disabled={createProjectMutation.isPending}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">원</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">최소 100만원 이상</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={createProjectMutation.isPending}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={createProjectMutation.isPending}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                프로젝트 상세 설명 <span className="text-red-500">*</span>
              </label>

              {/* 리치 텍스트 에디터 툴바 */}
              <div className="flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded-t-lg">
                <button
                  type="button"
                  onClick={toggleBold}
                  disabled={createProjectMutation.isPending}
                  className={`p-2 rounded hover:bg-gray-200 disabled:cursor-not-allowed ${isBold ? 'bg-gray-300' : ''}`}
                  title="굵게"
                >
                  <Bold size={18} />
                </button>
                <button
                  type="button"
                  onClick={toggleItalic}
                  disabled={createProjectMutation.isPending}
                  className={`p-2 rounded hover:bg-gray-200 disabled:cursor-not-allowed ${isItalic ? 'bg-gray-300' : ''}`}
                  title="기울임"
                >
                  <Italic size={18} />
                </button>
                <div className="w-px h-6 bg-gray-300"></div>
                <button
                  type="button"
                  onClick={applyHeading}
                  disabled={createProjectMutation.isPending}
                  className="p-2 rounded hover:bg-gray-200 disabled:cursor-not-allowed"
                  title="제목"
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={insertList}
                  disabled={createProjectMutation.isPending}
                  className="p-2 rounded hover:bg-gray-200 disabled:cursor-not-allowed"
                  title="목록"
                >
                  <List size={18} />
                </button>
                <div className="ml-auto text-xs text-gray-500">
                  {description.length} / 5000자
                </div>
              </div>

              {/* 리치 텍스트 에디터 영역 */}
              <div
                ref={editorRef}
                contentEditable={!createProjectMutation.isPending}
                onInput={(e) => setDescription(e.currentTarget.textContent || '')}
                className="w-full min-h-[300px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}
                data-placeholder="프로젝트의 목적, 기대 효과, 사용 계획 등을 자세히 작성해주세요..."
              />
              <style>{`
                [contentEditable][data-placeholder]:empty:before {
                  content: attr(data-placeholder);
                  color: #9ca3af;
                }
              `}</style>
            </div>

            {/* 대표 이미지 업로드 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                대표 이미지 (최대 5개)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={createProjectMutation.isPending}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors ${createProjectMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ImageIcon className="text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">클릭하여 이미지 업로드</p>
                <p className="text-xs text-gray-500 mt-1">{uploadedImages.length} / 5개</p>
              </label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        disabled={createProjectMutation.isPending}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* 사용계획서 업로드 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <FileText className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">사용계획서 첨부</h3>
                  <p className="text-sm text-gray-600">
                    기부금 사용 계획을 상세히 작성한 문서를 첨부해주세요.
                  </p>
                </div>
              </div>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handlePlanUpload}
                disabled={createProjectMutation.isPending}
                className="hidden"
                id="plan-upload"
              />

              {planDocument ? (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded">
                        <CheckCircle className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{planDocument.name}</p>
                        <p className="text-xs text-gray-500">
                          {(planDocument.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPlanDocument(null)}
                      disabled={createProjectMutation.isPending}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="plan-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${createProjectMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 font-medium">클릭하여 파일 업로드</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (최대 10MB)</p>
                </label>
              )}
            </div>

            {/* 최종 확인 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">최종 확인</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">프로젝트명:</span>
                  <span className="font-semibold">{projectTitle}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">카테고리:</span>
                  <span className="font-semibold">{projectCategory}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">목표 금액:</span>
                  <span className="font-bold text-red-600">
                    {Number(targetAmount).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">모금 기간:</span>
                  <span className="font-semibold">{startDate} ~ {endDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">이미지:</span>
                  <span className="font-semibold">{uploadedImages.length}개</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">사용계획서:</span>
                  <span className="font-semibold">
                    {planDocument ? '첨부됨' : '미첨부'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>안내:</strong> 제출하신 프로젝트는 관리자 검토 후 승인됩니다.
                승인까지 2-3 영업일이 소요됩니다.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          disabled={createProjectMutation.isPending}
          className="mb-4 md:mb-6 text-gray-600 hover:text-gray-900 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
        >
          ← 돌아가기
        </button>

        {/* 진행 단계 표시 */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            {['기본 정보', '목표 & 일정', '상세 설명', '최종 확인'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-lg ${
                    currentStep > index + 1 ? 'bg-green-500 text-white' :
                    currentStep === index + 1 ? 'bg-red-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className="text-xs mt-1 md:mt-2 font-medium text-gray-600 text-center hidden sm:block">{label}</span>
                </div>
                {index < 3 && (
                  <div className={`w-12 md:w-24 h-1 mx-1 md:mx-2 ${
                    currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 lg:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
            프로젝트 등록
          </h2>

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {renderStep()}

          {/* 버튼 */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                disabled={createProjectMutation.isPending}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                이전
              </button>
            )}
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={createProjectMutation.isPending}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createProjectMutation.isPending}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>제출 중...</span>
                  </>
                ) : (
                  '제출하기'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPage;
