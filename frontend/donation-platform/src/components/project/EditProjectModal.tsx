import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import RichTextEditor from '../editor/RichTextEditor';
import type { Project } from '../../types';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

/**
 * 프로젝트 수정 모달
 * - 제목과 소개만 수정 가능
 * - CLOSED, CANCELLED, REJECTED 상태는 수정 불가
 */
const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState(project.title || '');
  const [description, setDescription] = useState(project.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    setErrorMessage('');

    // 유효성 검사
    if (!title.trim()) {
      setErrorMessage('프로젝트 제목을 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('프로젝트 소개를 입력해주세요.');
      return;
    }

    if (title.length > 200) {
      setErrorMessage('제목은 200자 이내로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(title, description);
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message || '프로젝트 수정 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">프로젝트 수정</h2>
            <p className="text-sm text-gray-500 mt-1">
              제목과 소개만 수정할 수 있습니다
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">수정 가능 항목</p>
              <ul className="list-disc list-inside space-y-1">
                <li>프로젝트 제목</li>
                <li>프로젝트 소개 (이미지, 텍스트 스타일링 등 모든 기능 사용 가능)</li>
              </ul>
              <p className="mt-2 text-xs text-blue-700">
                ※ 목표 금액, 기간, 카테고리 등 핵심 정보는 투명성을 위해 수정할 수 없습니다.
              </p>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* 프로젝트 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              프로젝트 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={isSubmitting}
              placeholder="프로젝트 제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200자
            </p>
          </div>

          {/* 프로젝트 소개 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              프로젝트 소개 <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="프로젝트에 대한 상세한 설명을 작성해주세요..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              이미지 삽입, 폰트 변경, 텍스트 스타일링 등 모든 기능을 사용할 수 있습니다.
            </p>
          </div>

          {/* 수정 불가 항목 안내 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">수정 불가 항목 (참고용)</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>카테고리:</span>
                <span className="font-medium">{project.category}</span>
              </div>
              <div className="flex justify-between">
                <span>목표 금액:</span>
                <span className="font-medium">{project.targetAmount?.toLocaleString('ko-KR')}원</span>
              </div>
              <div className="flex justify-between">
                <span>기간:</span>
                <span className="font-medium">
                  {project.startDate} ~ {project.endDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>프로젝트 상태:</span>
                <span className="font-medium">{project.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                수정 중...
              </>
            ) : (
              <>
                <Save size={20} />
                수정 완료
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
