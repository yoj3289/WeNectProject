import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, Clock, FileText, Loader2 } from 'lucide-react';

interface BudgetPlanHistory {
  historyId: number;
  projectId: number;
  previousPlan: string;
  newPlan: string;
  changeReason: string;
  changedAt: string;
  projectStatus: string;
}

interface BudgetPlanHistoryTimelineProps {
  history: BudgetPlanHistory[];
  isLoading: boolean;
  originalPlan: string;
}

/**
 * 사용계획 변경 이력 타임라인 컴포넌트
 * - 클릭해서 펼치기/접기
 * - 타임라인 형식으로 변경 이력 표시
 */
const BudgetPlanHistoryTimeline: React.FC<BudgetPlanHistoryTimelineProps> = ({
  history,
  isLoading,
  originalPlan
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* 헤더 - 클릭하면 펼치기/접기 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-stone-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-stone-200 hover:bg-stone-100 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <History size={16} className="text-amber-600 sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="text-left min-w-0">
              <h4 className="font-medium text-sm sm:text-lg text-stone-800 truncate">사용계획 변경 이력</h4>
              <p className="text-[10px] sm:text-sm text-stone-500">
                {history.length}회 변경 · {isExpanded ? '접기' : '펼치기'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] sm:text-xs font-medium">
              {history.length}회
            </span>
            {isExpanded ? (
              <ChevronUp size={18} className="text-stone-400" />
            ) : (
              <ChevronDown size={18} className="text-stone-400" />
            )}
          </div>
        </div>
      </button>

      {/* 타임라인 내용 */}
      {isExpanded && (
        <div className="p-3 sm:p-6">
          {isLoading ? (
            <div className="p-4 sm:p-6 text-center">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-stone-500">변경 이력을 불러오는 중...</p>
            </div>
          ) : (
            <div className="relative">
              {/* 타임라인 세로선 */}
              <div className="absolute left-[14px] sm:left-5 top-0 bottom-0 w-0.5 bg-stone-200" />

              {/* 타임라인 항목들 */}
              <div className="space-y-4 sm:space-y-6">
                {/* 최신 변경부터 표시 */}
                {history.map((item, index) => (
                  <div key={item.historyId} className="relative pl-8 sm:pl-12">
                    {/* 타임라인 점 */}
                    <div className={`absolute left-1 sm:left-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                      index === 0 ? 'bg-amber-500' : 'bg-stone-300'
                    }`}>
                      {index === 0 && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                      )}
                    </div>

                    {/* 변경 내용 */}
                    <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200">
                      {/* 시간 + 배지 */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Clock size={12} className="text-stone-400 sm:w-[14px] sm:h-[14px]" />
                        <span className="text-xs sm:text-sm text-stone-600 font-medium">
                          {formatDate(item.changedAt)}
                        </span>
                        {index === 0 && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] sm:text-xs font-bold">
                            최신
                          </span>
                        )}
                      </div>

                      {/* 변경 사유 */}
                      <div className="bg-amber-50 rounded-lg px-2.5 sm:px-3 py-2 mb-2 sm:mb-3 border-l-2 sm:border-l-3 border-amber-400">
                        <p className="text-[10px] sm:text-xs text-amber-600 font-semibold mb-0.5">변경 사유</p>
                        <p className="text-xs sm:text-sm text-stone-700 break-words">{item.changeReason}</p>
                      </div>

                      {/* 수정된 계획 */}
                      <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-stone-200">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                          <FileText size={12} className="text-green-600 sm:w-[14px] sm:h-[14px]" />
                          <p className="text-[10px] sm:text-xs text-green-600 font-semibold">수정된 사용계획</p>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-wrap break-words">
                          {item.newPlan || '(내용 없음)'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 최초 사용계획 */}
                <div className="relative pl-8 sm:pl-12">
                  {/* 타임라인 점 */}
                  <div className="absolute left-1 sm:left-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-stone-400 border-2 border-white shadow-sm" />

                  {/* 최초 계획 */}
                  <div className="bg-stone-100 rounded-xl p-3 sm:p-4 border border-stone-300">
                    {/* 시간 + 배지 */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <Clock size={12} className="text-stone-400 sm:w-[14px] sm:h-[14px]" />
                      <span className="text-xs sm:text-sm text-stone-500 font-medium">프로젝트 등록 시</span>
                      <span className="px-1.5 sm:px-2 py-0.5 bg-stone-400 text-white rounded text-[10px] sm:text-xs font-bold">
                        최초
                      </span>
                    </div>

                    {/* 최초 계획 */}
                    <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-stone-200">
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                        <FileText size={12} className="text-stone-500 sm:w-[14px] sm:h-[14px]" />
                        <p className="text-[10px] sm:text-xs text-stone-500 font-semibold">최초 사용계획</p>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-600 whitespace-pre-wrap break-words">
                        {history.length > 0
                          ? (history[history.length - 1].previousPlan || '(내용 없음)')
                          : (originalPlan || '(내용 없음)')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetPlanHistoryTimeline;
