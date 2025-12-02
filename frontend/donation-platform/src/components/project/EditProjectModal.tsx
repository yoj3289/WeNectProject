import React, { useState } from 'react';
import { X, FileEdit, Lock, Calendar, Target, Tag, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project } from '../../types';
import { getCategoryLabel } from '../../types';
import RichTextEditor from '../editor/RichTextEditor';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

/**
 * 프로젝트 수정 모달
 * - 제목과 소개만 수정 가능
 * - 목표 금액, 기간, 카테고리 등 핵심 정보는 수정 불가
 */
const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxTitleLength = 200;

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

    setIsSubmitting(true);
    try {
      await onSubmit(title, description);
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
                <p className="text-sm text-stone-400">제목과 소개 내용을 수정합니다</p>
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
              disabled={isSubmitting || !title.trim() || !description.trim()}
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
