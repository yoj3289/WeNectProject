import React, { useState } from 'react';
import { X, FileEdit, Lock, Calendar, Target, Tag, Building2, ClipboardList, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project } from '../../types';
import { getCategoryLabel } from '../../types';
import RichTextEditor from '../editor/RichTextEditor';
import { useSettlementsByProject } from '../../hooks/useSettlements';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (title: string, description: string, budgetPlan?: string, budgetPlanChangeReason?: string) => Promise<void>;
}

/**
 * 프로젝트 수정 모달
 * - 제목, 소개: ACTIVE, COMPLETED 상태에서 수정 가능
 * - 기부금 사용계획: COMPLETED 상태에서만 수정 가능 (변경 사유 필수)
 * - 목표 금액, 기간, 카테고리 등 핵심 정보는 수정 불가
 */
const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [budgetPlan, setBudgetPlan] = useState(project.budgetPlan || '');
  const [budgetPlanChangeReason, setBudgetPlanChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxTitleLength = 200;

  // 프로젝트의 정산 요청 목록 조회
  const { data: settlements = [], isLoading: isLoadingSettlements } = useSettlementsByProject(project.id);

  // 정산 요청 대기 중인지 확인 (PENDING 상태인 정산 요청이 있는지)
  const hasPendingSettlement = settlements.some(s => s.status === 'PENDING');

  // 모금 비율 계산 (100% 정확히 달성한 경우는 수정 불가)
  const fundingPercentage = project.targetAmount > 0
    ? (project.currentAmount / project.targetAmount) * 100
    : 0;
  const isExactly100Percent = fundingPercentage === 100;

  // 상태 확인 - 사용계획 수정은 COMPLETED 상태 + 정산 요청 대기 중이 아닐 때 + 100% 정확히 달성이 아닐 때만 가능
  const isCompleted = project.status?.toUpperCase() === 'COMPLETED';
  const canEditBudgetPlan = isCompleted && !hasPendingSettlement && !isLoadingSettlements && !isExactly100Percent;
  const budgetPlanChanged = budgetPlan !== (project.budgetPlan || '');

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('프로젝트 제목을 입력해주세요.');
      return;
    }

    if (title.length > maxTitleLength) {
      toast.error(`제목은 ${maxTitleLength}자 이내로 입력해주세요.`);
      return;
    }

    if (!description.trim()) {
      toast.error('프로젝트 소개를 입력해주세요.');
      return;
    }

    // COMPLETED 상태에서 사용계획 변경 시 사유 필수
    if (isCompleted && budgetPlanChanged && !budgetPlanChangeReason.trim()) {
      toast.error('사용계획 변경 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 사용계획 변경이 없으면 budgetPlan을 undefined로 전달하여 기존 값 유지
      const submitBudgetPlan = canEditBudgetPlan && budgetPlanChanged ? budgetPlan : undefined;
      const submitChangeReason = canEditBudgetPlan && budgetPlanChanged ? budgetPlanChangeReason : undefined;

      await onSubmit(title, description, submitBudgetPlan, submitChangeReason);
      toast.success('프로젝트가 수정되었습니다.');
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '프로젝트 수정에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': '승인 대기',
      'APPROVED': '승인됨',
      'ACTIVE': '진행 중',
      'COMPLETED': '모금 완료',
      'SETTLEMENT': '결산 중',
      'CLOSED': '종료됨',
      'CANCELLED': '취소됨',
      'REJECTED': '반려됨',
    };
    return statusMap[status.toUpperCase()] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 헤더 - 다크 스타일 */}
        <div className="bg-stone-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <FileEdit size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">프로젝트 수정</h2>
                <p className="text-sm text-stone-400">
                  {canEditBudgetPlan
                    ? '제목, 소개, 사용계획을 수정합니다'
                    : '제목, 소개를 수정합니다'}
                </p>
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
          {/* 수정 불가 항목 - 상단 고정 배너 */}
          <div className="bg-stone-100 border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={14} className="text-stone-500" />
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">수정 불가 항목</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl px-3 py-2.5 border border-stone-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Tag size={12} className="text-stone-400" />
                  <span className="text-[10px] text-stone-500 uppercase">카테고리</span>
                </div>
                <p className="text-sm font-medium text-stone-800 truncate">{getCategoryLabel(project.category)}</p>
              </div>
              <div className="bg-white rounded-xl px-3 py-2.5 border border-stone-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-stone-400" />
                  <span className="text-[10px] text-stone-500 uppercase">목표 금액</span>
                </div>
                <p className="text-sm font-medium text-stone-800">{project.targetAmount.toLocaleString()}원</p>
              </div>
              <div className="bg-white rounded-xl px-3 py-2.5 border border-stone-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={12} className="text-stone-400" />
                  <span className="text-[10px] text-stone-500 uppercase">기간</span>
                </div>
                <p className="text-sm font-medium text-stone-800">
                  {project.startDate && project.endDate
                    ? `${formatDate(project.startDate).slice(5)} ~ ${formatDate(project.endDate).slice(5)}`
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-xl px-3 py-2.5 border border-stone-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 size={12} className="text-stone-400" />
                  <span className="text-[10px] text-stone-500 uppercase">상태</span>
                </div>
                <p className="text-sm font-medium text-stone-800">{getStatusLabel(project.status)}</p>
              </div>
            </div>
          </div>

          {/* 수정 가능 영역 */}
          <div className="p-6 space-y-6">
            {/* 프로젝트 제목 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">
                  프로젝트 제목
                </label>
                <span className={`text-xs ${title.length > maxTitleLength * 0.9 ? 'text-amber-600' : 'text-stone-400'}`}>
                  {title.length}/{maxTitleLength}
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="프로젝트 제목을 입력하세요"
                maxLength={maxTitleLength}
                className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
            </div>

            {/* 프로젝트 소개 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                프로젝트 소개
              </label>
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="프로젝트에 대해 소개해주세요. 이미지, 텍스트 스타일링 등 모든 기능을 사용할 수 있습니다."
                />
              </div>
              <p className="text-xs text-stone-500 mt-2">
                이미지 삽입, 폰트 변경, 텍스트 스타일링 등 모든 기능을 사용할 수 있습니다.
              </p>
            </div>

            {/* 정산 요청 대기 중 안내 */}
            {isCompleted && hasPendingSettlement && (
              <div className="bg-stone-100 border border-stone-300 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-stone-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-stone-700">사용계획 수정 불가</p>
                    <p className="text-sm text-stone-600 mt-1">
                      정산 요청이 대기 중이므로 사용계획을 수정할 수 없습니다.
                      정산 요청이 반려되면 다시 수정할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 100% 정확히 달성 시 안내 */}
            {isCompleted && !hasPendingSettlement && isExactly100Percent && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700">사용계획 수정 불가</p>
                    <p className="text-sm text-green-600 mt-1">
                      목표 금액을 100% 달성한 프로젝트는 사용계획 변경이 필요하지 않습니다.
                      기존 계획대로 정산을 진행해주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 기부금 사용계획 - COMPLETED 상태 + 정산 요청 대기 중 아닐 때만 수정 가능 */}
            {canEditBudgetPlan && (
              <div className="space-y-4">
                {/* 사용계획 변경 안내 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">사용계획 변경 시 주의사항</p>
                      <p className="text-sm text-amber-700 mt-1">
                        사용계획 변경 시 변경 사유를 반드시 입력해야 하며, 변경 이력이 기부자에게 공개됩니다.
                        정산 요청 후에는 수정이 불가합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 기부금 사용계획 입력 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList size={16} className="text-amber-600" />
                    <label className="text-sm font-medium text-stone-700">
                      기부금 사용계획
                    </label>
                  </div>
                  <textarea
                    value={budgetPlan}
                    onChange={(e) => setBudgetPlan(e.target.value)}
                    placeholder="기부금을 어떻게 사용할 계획인지 작성해주세요."
                    rows={5}
                    className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
                  />
                </div>

                {/* 변경 사유 입력 - 사용계획이 변경된 경우에만 표시 */}
                {budgetPlanChanged && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      변경 사유 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={budgetPlanChangeReason}
                      onChange={(e) => setBudgetPlanChangeReason(e.target.value)}
                      placeholder="사용계획 변경 사유를 작성해주세요. (예: 목표 금액 미달성으로 인한 계획 조정)"
                      rows={3}
                      className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
                    />
                    <p className="text-xs text-stone-500 mt-2">
                      변경 사유는 기부자에게 공개됩니다.
                    </p>
                  </div>
                )}
              </div>
            )}
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
              disabled={isSubmitting || !title.trim() || !description.trim() || (isCompleted && budgetPlanChanged && !budgetPlanChangeReason.trim())}
              className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  수정 중...
                </>
              ) : (
                <>
                  <FileEdit size={18} />
                  수정 완료
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
