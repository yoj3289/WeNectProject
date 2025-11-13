import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, FileText, CheckCircle, Loader2, AlertCircle, Wallet, Plus } from 'lucide-react';
import { useCreateProject } from '../../hooks/useProjects';
import { useAuthStore } from '../../stores/authStore';
import RichTextEditor from '../../components/editor/RichTextEditor';
import type { DonationOption } from '../../types';
import '../../components/editor/editor.css';

interface CreateProjectPageProps {
  onSubmit: () => void;
}

const CreateProjectPage: React.FC<CreateProjectPageProps> = ({
  onSubmit
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 기본 정보
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // 로그인한 사용자의 기관명을 자동으로 설정
  useEffect(() => {
    if (user?.organizationName) {
      setOrganizationName(user.organizationName);
    }
  }, [user]);

  // 목표 & 일정
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 상세 설명 (리치 텍스트)
  const [description, setDescription] = useState('');

  // 이미지
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  // 기부 옵션 (신규)
  const [donationOptions, setDonationOptions] = useState<DonationOption[]>([
    { optionName: '', amount: 0, optionDescription: '', iconEmoji: '💝' }
  ]);

  // 기부금 사용계획 (신규)
  const [budgetPlan, setBudgetPlan] = useState('');

  // 사용계획서 파일
  const [planDocument, setPlanDocument] = useState<File | null>(null);

  // 계획서 공개 여부
  const [isPlanPublic, setIsPlanPublic] = useState(true);

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

  // 기부 옵션 추가
  const addOption = () => {
    if (donationOptions.length >= 10) {
      setErrorMessage('기부 옵션은 최대 10개까지 추가 가능합니다.');
      return;
    }
    setDonationOptions([
      ...donationOptions,
      { optionName: '', amount: 0, optionDescription: '', iconEmoji: '💝' }
    ]);
    setErrorMessage('');
  };

  // 기부 옵션 제거
  const removeOption = (index: number) => {
    if (donationOptions.length <= 1) {
      setErrorMessage('기부 옵션은 최소 1개 이상이어야 합니다.');
      return;
    }
    setDonationOptions(donationOptions.filter((_, i) => i !== index));
    setErrorMessage('');
  };

  // 기부 옵션 업데이트
  const updateOption = (index: number, field: keyof DonationOption, value: string | number) => {
    const updated = [...donationOptions];
    updated[index] = { ...updated[index], [field]: value };
    setDonationOptions(updated);
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
    } else if (currentStep === 4) {
      // 기부 옵션 검증
      const hasEmptyOption = donationOptions.some(opt => !opt.optionName || opt.amount < 1000);
      if (hasEmptyOption) {
        setErrorMessage('모든 기부 옵션의 이름과 금액(최소 1,000원)을 입력해주세요.');
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
    // 기부금 사용계획 검증
    if (!budgetPlan.trim()) {
      setErrorMessage('기부금 사용계획은 필수입니다.');
      return;
    }

    // 상세 사용계획서 필수 검증
    if (!planDocument) {
      setErrorMessage('상세 사용계획서 파일을 업로드해주세요.');
      return;
    }

    try {
      setErrorMessage('');

      // FormData 생성
      const formData = new FormData();
      formData.append('title', projectTitle);
      formData.append('category', projectCategory);
      formData.append('description', description);
      formData.append('targetAmount', targetAmount);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);

      // 기부금 사용계획 (필수)
      formData.append('budgetPlan', budgetPlan);

      // 계획서 공개 여부
      formData.append('isPlanPublic', String(isPlanPublic));

      // 기부 옵션 JSON 문자열로 변환
      const optionsWithOrder = donationOptions.map((opt, index) => ({
        optionName: opt.optionName,
        optionDescription: opt.optionDescription || '',
        amount: opt.amount,
        iconEmoji: opt.iconEmoji || '💝',
        displayOrder: index,
        isActive: true
      }));
      formData.append('donationOptions', JSON.stringify(optionsWithOrder));

      // 이미지 추가
      uploadedImages.forEach((image) => {
        formData.append('images', image);
      });

      // 사용계획서 파일 추가 (필수)
      formData.append('planDocument', planDocument);

      // API 호출
      await createProjectMutation.mutateAsync(formData);

      alert('프로젝트 등록이 완료되었습니다!\n관리자 승인 후 게시됩니다.');
      onSubmit();
    } catch (error: any) {
      console.error('프로젝트 등록 실패:', error);
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
                readOnly
                placeholder="로그인한 기관명이 자동으로 표시됩니다"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
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
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="프로젝트의 목적, 기대 효과, 사용 계획 등을 자세히 작성해주세요..."
              />
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
            {/* 기부 옵션 추가 */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={28} className="text-red-600" />
                <h3 className="text-xl font-bold text-gray-800">
                  기부 옵션 설정
                </h3>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                기부자가 선택할 수 있는 옵션을 추가해주세요.
                (예: "1명의 아동 식사 지원 - 4,000원")
              </p>
            </div>

            {/* 옵션 리스트 */}
            {donationOptions.map((option, index) => (
              <div key={index} className="bg-white border-2 border-gray-300 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800">옵션 {index + 1}</h4>
                  {donationOptions.length > 1 && (
                    <button
                      onClick={() => removeOption(index)}
                      disabled={createProjectMutation.isPending}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* 옵션명 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      옵션명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={option.optionName}
                      onChange={(e) => updateOption(index, 'optionName', e.target.value)}
                      placeholder="예: 1명의 아동 식사 지원"
                      disabled={createProjectMutation.isPending}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* 금액 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      금액 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={option.amount || ''}
                        onChange={(e) => updateOption(index, 'amount', Number(e.target.value))}
                        placeholder="4000"
                        disabled={createProjectMutation.isPending}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">최소 1,000원 이상</p>
                  </div>

                  {/* 설명 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      설명 (선택)
                    </label>
                    <textarea
                      value={option.optionDescription || ''}
                      onChange={(e) => updateOption(index, 'optionDescription', e.target.value)}
                      placeholder="1명의 아동에게 따뜻한 한 끼를 제공합니다"
                      rows={2}
                      disabled={createProjectMutation.isPending}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                </div>
              </div>
            ))}

            {/* 옵션 추가 버튼 */}
            <button
              onClick={addOption}
              disabled={donationOptions.length >= 10 || createProjectMutation.isPending}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-semibold hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              옵션 추가 ({donationOptions.length}/10)
            </button>

          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* 기부금 사용계획 작성 (필수) */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Wallet className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    기부금 사용계획 작성 <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    기부자들이 쉽게 이해할 수 있도록 기부금 사용 계획을 작성해주세요.
                  </p>
                </div>
              </div>

              <textarea
                value={budgetPlan}
                onChange={(e) => setBudgetPlan(e.target.value)}
                placeholder={`예시:

• 식자재 구매: 3,000,000원 (75%)
  - 쌀, 반찬 재료, 과일 등 구매

• 배송 및 포장: 500,000원 (12.5%)
  - 도시락 용기, 배송 차량 유류비

• 운영비: 500,000원 (12.5%)
  - 자원봉사자 식비, 주방 운영비

총 목표 금액: 4,000,000원`}
                rows={12}
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />

              <p className="text-xs text-gray-500 mt-2">
                구체적인 항목과 금액을 작성하면 기부자의 신뢰도가 높아집니다.
              </p>
            </div>

            {/* 상세 사용계획서 업로드 (선택) */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <FileText className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    상세 사용계획서 첨부 <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    상세 사용계획서 파일 제출은 필수입니다.
                    사용자에게 공개할지 여부는 아래에서 선택할 수 있습니다.
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
            {['기본 정보', '목표 & 일정', '상세 설명', '기부 옵션', '사용계획 & 확인'].map((label, index) => (
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
                {index < 4 && (
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
            {currentStep < 5 ? (
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
