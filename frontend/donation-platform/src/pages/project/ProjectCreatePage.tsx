import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, FileText, CheckCircle, Loader2, AlertCircle, Wallet, Plus, ChevronLeft, Target, Edit3, Gift, ClipboardList, Save, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateProject } from '../../hooks/useProjects';
import { useAuthStore } from '../../stores/authStore';
import RichTextEditor from '../../components/editor/RichTextEditor';
import type { DonationOption } from '../../types';
import '../../components/editor/editor.css';

// 임시 저장 데이터 타입
interface DraftData {
  projectTitle: string;
  projectCategory: string;
  targetAmount: string;
  startDate: string;
  endDate: string;
  description: string;
  donationOptions: DonationOption[];
  budgetPlan: string;
  isPlanPublic: boolean;
  currentStep: number;
  savedAt: string;
}

const DRAFT_STORAGE_KEY = 'project_create_draft';

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

  useEffect(() => {
    if (user?.organizationName) {
      setOrganizationName(user.organizationName);
    }
  }, [user]);

  // 목표 & 일정
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 상세 설명
  const [description, setDescription] = useState('');

  // 이미지
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  // 기부 옵션
  const [donationOptions, setDonationOptions] = useState<DonationOption[]>([
    { optionName: '', amount: 0, optionDescription: '', iconEmoji: '💝' }
  ]);

  // 기부금 사용계획
  const [budgetPlan, setBudgetPlan] = useState('');

  // 사용계획서 파일
  const [planDocument, setPlanDocument] = useState<File | null>(null);

  // 계획서 공개 여부
  const [isPlanPublic, setIsPlanPublic] = useState(true);

  // 현재 단계
  const [currentStep, setCurrentStep] = useState(1);

  // 에러 메시지
  const [errorMessage, setErrorMessage] = useState('');

  // 임시 저장 관련 상태
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialized = useRef(false);

  // API
  const createProjectMutation = useCreateProject();

  // 임시 저장 데이터 생성
  const createDraftData = useCallback((): DraftData => {
    return {
      projectTitle,
      projectCategory,
      targetAmount,
      startDate,
      endDate,
      description,
      donationOptions,
      budgetPlan,
      isPlanPublic,
      currentStep,
      savedAt: new Date().toISOString(),
    };
  }, [projectTitle, projectCategory, targetAmount, startDate, endDate, description, donationOptions, budgetPlan, isPlanPublic, currentStep]);

  // 임시 저장
  const saveDraft = useCallback(() => {
    try {
      const draftData = createDraftData();
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setLastSavedAt(draftData.savedAt);
      return true;
    } catch (error) {
      console.error('임시 저장 실패:', error);
      return false;
    }
  }, [createDraftData]);

  // 수동 임시 저장
  const handleManualSave = () => {
    setIsSaving(true);
    const success = saveDraft();
    setTimeout(() => {
      setIsSaving(false);
      if (success) {
        toast.success('임시 저장되었습니다.');
      } else {
        toast.error('임시 저장에 실패했습니다.');
      }
    }, 300);
  };

  // 임시 저장 데이터 불러오기
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draftData: DraftData = JSON.parse(saved);
        setProjectTitle(draftData.projectTitle || '');
        setProjectCategory(draftData.projectCategory || '');
        setTargetAmount(draftData.targetAmount || '');
        setStartDate(draftData.startDate || '');
        setEndDate(draftData.endDate || '');
        setDescription(draftData.description || '');
        setDonationOptions(draftData.donationOptions || [{ optionName: '', amount: 0, optionDescription: '', iconEmoji: '💝' }]);
        setBudgetPlan(draftData.budgetPlan || '');
        setIsPlanPublic(draftData.isPlanPublic ?? true);
        setCurrentStep(draftData.currentStep || 1);
        setLastSavedAt(draftData.savedAt);
        toast.success('임시 저장된 내용을 불러왔습니다.');
      }
    } catch (error) {
      console.error('임시 저장 불러오기 실패:', error);
      toast.error('임시 저장 데이터를 불러오는데 실패했습니다.');
    }
  }, []);

  // 임시 저장 데이터 삭제
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLastSavedAt(null);
  }, []);

  // 임시 저장 데이터 확인
  const checkDraft = useCallback((): DraftData | null => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('임시 저장 확인 실패:', error);
    }
    return null;
  }, []);

  // 페이지 진입 시 임시 저장 데이터 확인
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const draft = checkDraft();
      if (draft && draft.projectTitle) {
        setShowDraftModal(true);
      }
    }
  }, [checkDraft]);

  // 자동 저장 (30초마다)
  useEffect(() => {
    const hasContent = projectTitle || description || targetAmount || budgetPlan;
    if (!hasContent) return;

    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000); // 30초

    return () => clearInterval(autoSaveInterval);
  }, [saveDraft, projectTitle, description, targetAmount, budgetPlan]);

  // 페이지 이탈 시 저장 확인
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasContent = projectTitle || description || targetAmount || budgetPlan;
      if (hasContent) {
        saveDraft();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft, projectTitle, description, targetAmount, budgetPlan]);

  // 시간 포맷팅
  const formatSavedTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 카테고리 옵션
  const categories = ['아동복지', '노인복지', '장애인복지', '동물보호', '환경보호', '교육'];

  // 스텝 정보
  const steps = [
    { num: 1, label: '기본 정보', icon: Edit3 },
    { num: 2, label: '목표 & 일정', icon: Target },
    { num: 3, label: '상세 설명', icon: FileText },
    { num: 4, label: '기부 옵션', icon: Gift },
    { num: 5, label: '사용계획 & 확인', icon: ClipboardList },
  ];

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

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // 사용계획서 업로드
  const handlePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('PDF, DOC, DOCX 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setPlanDocument(file);
    setErrorMessage('');
  };

  // 기부 옵션 관리
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

  const removeOption = (index: number) => {
    if (donationOptions.length <= 1) {
      setErrorMessage('기부 옵션은 최소 1개 이상이어야 합니다.');
      return;
    }
    setDonationOptions(donationOptions.filter((_, i) => i !== index));
    setErrorMessage('');
  };

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
      const hasEmptyOption = donationOptions.some(opt => !opt.optionName || opt.amount < 1000);
      if (hasEmptyOption) {
        setErrorMessage('모든 기부 옵션의 이름과 금액(최소 1,000원)을 입력해주세요.');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setErrorMessage('');
    setCurrentStep(currentStep - 1);
  };

  // 제출
  const handleSubmit = async () => {
    if (!budgetPlan.trim()) {
      setErrorMessage('기부금 사용계획은 필수입니다.');
      return;
    }

    if (!planDocument) {
      setErrorMessage('상세 사용계획서 파일을 업로드해주세요.');
      return;
    }

    try {
      setErrorMessage('');

      const formData = new FormData();
      formData.append('title', projectTitle);
      formData.append('category', projectCategory);
      formData.append('description', description);
      formData.append('targetAmount', targetAmount);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('budgetPlan', budgetPlan);
      formData.append('isPlanPublic', String(isPlanPublic));

      const optionsWithOrder = donationOptions.map((opt, index) => ({
        optionName: opt.optionName,
        optionDescription: opt.optionDescription || '',
        amount: opt.amount,
        iconEmoji: opt.iconEmoji || '💝',
        displayOrder: index,
        isActive: true
      }));
      formData.append('donationOptions', JSON.stringify(optionsWithOrder));

      uploadedImages.forEach((image) => {
        formData.append('images', image);
      });

      formData.append('planDocument', planDocument);

      await createProjectMutation.mutateAsync(formData);

      // 제출 성공 시 임시 저장 데이터 삭제
      clearDraft();

      toast.success('프로젝트 등록이 완료되었습니다! 관리자 승인 후 게시됩니다.');
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
              <label className="block text-sm text-stone-600 mb-2">
                프로젝트명 <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="따뜻한 겨울나기 프로젝트"
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                카테고리 <span className="text-amber-600">*</span>
              </label>
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed transition-all"
              >
                <option value="">선택해주세요</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                기관명 <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={organizationName}
                readOnly
                placeholder="로그인한 기관명이 자동으로 표시됩니다"
                className="w-full px-4 py-3.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 cursor-not-allowed"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-stone-600 mb-2">
                목표 금액 <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="10000000"
                  disabled={createProjectMutation.isPending}
                  className="w-full px-4 py-3.5 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 font-medium">원</span>
              </div>
              <p className="text-xs text-stone-500 mt-1.5">최소 100만원 이상</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-stone-600 mb-2">
                  시작일 <span className="text-amber-600">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={createProjectMutation.isPending}
                  className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-2">
                  종료일 <span className="text-amber-600">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={createProjectMutation.isPending}
                  className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-stone-600 mb-2">
                프로젝트 상세 설명 <span className="text-amber-600">*</span>
              </label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="프로젝트의 목적, 기대 효과, 사용 계획 등을 자세히 작성해주세요..."
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
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
                className={`flex flex-col items-center justify-center w-full h-32 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all ${createProjectMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ImageIcon className="text-stone-400 mb-2" size={32} />
                <p className="text-sm text-stone-600">클릭하여 이미지 업로드</p>
                <p className="text-xs text-stone-500 mt-1">{uploadedImages.length} / 5개</p>
              </label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-full h-24 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        disabled={createProjectMutation.isPending}
                        className="absolute -top-2 -right-2 p-1 bg-stone-900 text-white rounded-full hover:bg-red-500 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <X size={14} />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 uppercase tracking-widest text-[10px] mb-1">Donation Options</p>
                <h3 className="text-lg font-light text-stone-800">
                  기부 <span className="font-medium">옵션 설정</span>
                </h3>
              </div>
              <button
                onClick={addOption}
                disabled={createProjectMutation.isPending || donationOptions.length >= 10}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Plus size={16} />
                옵션 추가
              </button>
            </div>

            <div className="space-y-4">
              {donationOptions.map((option, index) => (
                <div key={index} className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-stone-700">옵션 {index + 1}</span>
                    {donationOptions.length > 1 && (
                      <button
                        onClick={() => removeOption(index)}
                        disabled={createProjectMutation.isPending}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1.5">옵션명 *</label>
                      <input
                        type="text"
                        value={option.optionName}
                        onChange={(e) => updateOption(index, 'optionName', e.target.value)}
                        placeholder="따뜻한 마음"
                        disabled={createProjectMutation.isPending}
                        className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1.5">금액 *</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={option.amount || ''}
                          onChange={(e) => updateOption(index, 'amount', Number(e.target.value))}
                          placeholder="10000"
                          disabled={createProjectMutation.isPending}
                          className="w-full px-3 py-2.5 pr-10 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">원</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-500 mb-1.5">설명 (선택)</label>
                    <input
                      type="text"
                      value={option.optionDescription}
                      onChange={(e) => updateOption(index, 'optionDescription', e.target.value)}
                      placeholder="이 금액으로 아이 1명에게 따뜻한 점퍼를 선물할 수 있어요"
                      disabled={createProjectMutation.isPending}
                      className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* 기부금 사용계획 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-600 uppercase tracking-widest text-[10px]">Budget Plan</p>
                  <h3 className="text-base font-medium text-stone-800">기부금 사용계획 <span className="text-amber-600">*</span></h3>
                </div>
              </div>
              <textarea
                value={budgetPlan}
                onChange={(e) => setBudgetPlan(e.target.value)}
                placeholder="기부금이 어떻게 사용될 예정인지 구체적으로 작성해주세요.&#10;예: 물품 구매 50%, 인건비 30%, 운영비 20%"
                rows={4}
                disabled={createProjectMutation.isPending}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none transition-all"
              />
            </div>

            {/* 상세 사용계획서 첨부 */}
            <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <FileText size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-600 uppercase tracking-widest text-[10px]">Document</p>
                  <h3 className="text-base font-medium text-stone-800">상세 사용계획서 첨부 <span className="text-amber-600">*</span></h3>
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
                <div className="bg-white rounded-xl p-4 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-stone-800 text-sm">{planDocument.name}</p>
                        <p className="text-xs text-stone-500">
                          {(planDocument.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPlanDocument(null)}
                      disabled={createProjectMutation.isPending}
                      className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      <X size={18} className="text-stone-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="plan-upload"
                  className={`flex flex-col items-center justify-center w-full h-28 bg-white border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all ${createProjectMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="text-stone-400 mb-2" size={28} />
                  <p className="text-sm text-stone-600 font-medium">클릭하여 파일 업로드</p>
                  <p className="text-xs text-stone-500 mt-1">PDF, DOC, DOCX (최대 10MB)</p>
                </label>
              )}

              {/* 공개 여부 */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200">
                <span className="text-sm text-stone-700">계획서 사용자 공개</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPlanPublic}
                    onChange={(e) => setIsPlanPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* 최종 확인 */}
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-stone-800 mb-4">최종 확인</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 text-sm">프로젝트명</span>
                  <span className="font-medium text-stone-800 text-sm">{projectTitle}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 text-sm">카테고리</span>
                  <span className="font-medium text-stone-800 text-sm">{projectCategory}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 text-sm">목표 금액</span>
                  <span className="font-medium text-amber-600 text-sm">
                    {Number(targetAmount).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 text-sm">모금 기간</span>
                  <span className="font-medium text-stone-800 text-sm">{startDate} ~ {endDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 text-sm">이미지</span>
                  <span className="font-medium text-stone-800 text-sm">{uploadedImages.length}개</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-500 text-sm">사용계획서</span>
                  <span className="font-medium text-stone-800 text-sm">
                    {planDocument ? '첨부됨' : '미첨부'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
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

  // 임시 저장 복원 모달
  const DraftRestoreModal = () => {
    const draft = checkDraft();
    if (!draft) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* 다크 헤더 */}
          <div className="bg-stone-900 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Save className="text-amber-400" size={20} />
              </div>
              <h2 className="text-xl font-medium text-white">임시 저장된 내용이 있습니다</h2>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6">
            <div className="bg-stone-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <Clock size={16} />
                <span className="text-sm">저장 시간: {formatSavedTime(draft.savedAt)}</span>
              </div>
              <div className="space-y-2 text-sm">
                {draft.projectTitle && (
                  <p className="text-stone-700">
                    <span className="text-stone-500">프로젝트명:</span> {draft.projectTitle}
                  </p>
                )}
                {draft.projectCategory && (
                  <p className="text-stone-700">
                    <span className="text-stone-500">카테고리:</span> {draft.projectCategory}
                  </p>
                )}
                {draft.targetAmount && (
                  <p className="text-stone-700">
                    <span className="text-stone-500">목표 금액:</span> {Number(draft.targetAmount).toLocaleString()}원
                  </p>
                )}
              </div>
            </div>

            <p className="text-stone-600 text-sm mb-6">
              이전에 작성하던 내용을 불러오시겠습니까?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  clearDraft();
                  setShowDraftModal(false);
                }}
                className="flex-1 py-3 border border-stone-300 hover:bg-stone-50 rounded-xl font-medium text-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                새로 작성
              </button>
              <button
                onClick={() => {
                  loadDraft();
                  setShowDraftModal(false);
                }}
                className="flex-1 py-3 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                불러오기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 임시 저장 복원 모달 */}
      {showDraftModal && <DraftRestoreModal />}

      {/* Hero Section */}
      <section className="relative bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate(-1)}
            disabled={createProjectMutation.isPending}
            className="mb-4 text-stone-400 hover:text-white text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            돌아가기
          </button>
          <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-3">New Project</p>
          <h1 className="text-2xl md:text-3xl text-white font-light">
            프로젝트 <span className="font-medium">등록</span>
          </h1>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                    currentStep > step.num
                      ? 'bg-green-500 text-white'
                      : currentStep === step.num
                        ? 'bg-amber-500 text-stone-900'
                        : 'bg-stone-200 text-stone-500'
                  }`}>
                    {currentStep > step.num ? (
                      <CheckCircle size={20} />
                    ) : (
                      <step.icon size={18} />
                    )}
                  </div>
                  <span className="text-xs mt-2 font-medium text-stone-600 text-center hidden sm:block">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step.num ? 'bg-green-500' : 'bg-stone-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 임시 저장 상태 표시 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              {lastSavedAt ? (
                <>
                  <Clock size={14} />
                  <span>마지막 저장: {formatSavedTime(lastSavedAt)}</span>
                </>
              ) : (
                <span className="text-stone-400">자동 저장 활성화됨 (30초마다)</span>
              )}
            </div>
            <button
              onClick={handleManualSave}
              disabled={isSaving || createProjectMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={14} />
                  임시 저장
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {renderStep()}

          {/* 버튼 */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-stone-200">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                disabled={createProjectMutation.isPending}
                className="flex-1 px-6 py-3.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 disabled:bg-stone-100 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
            )}
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={createProjectMutation.isPending}
                className="flex-1 px-6 py-3.5 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createProjectMutation.isPending}
                className="flex-1 px-6 py-3.5 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
      </section>
    </div>
  );
};

export default CreateProjectPage;
