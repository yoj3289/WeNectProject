import React from 'react';
import { PiggyBank, TrendingUp, Users, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import type { SettlementSummary } from '../../types';

interface SettlementSummaryTabProps {
  summary: SettlementSummary;
}

const SettlementSummaryTab: React.FC<SettlementSummaryTabProps> = ({ summary }) => {
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const calculatePercentage = (current: number, total: number): number => {
    return Math.round((current / total) * 100);
  };

  const usagePercentage = calculatePercentage(summary.usedAmount, summary.totalAmount);

  return (
    <div className="space-y-6">
      {/* 프로젝트 완료 배너 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-green-600" size={28} />
          <h3 className="text-xl font-bold text-gray-900">프로젝트가 성공적으로 완료되었습니다!</h3>
        </div>
        <p className="text-gray-700 ml-10">
          여러분의 따뜻한 마음 덕분에 목표를 달성했습니다. 감사합니다.
        </p>
      </div>

      {/* 최종 결과 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-blue-600" size={24} />
            <p className="text-sm text-gray-600">총 모금액</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {formatAmount(summary.totalAmount)}원
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-purple-600" size={24} />
            <p className="text-sm text-gray-600">기부자 수</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {summary.donorCount}명
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank className="text-green-600" size={24} />
            <p className="text-sm text-gray-600">사용 금액</p>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatAmount(summary.usedAmount)}원
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-orange-600" size={24} />
            <p className="text-sm text-gray-600">종료일</p>
          </div>
          <p className="text-lg font-bold text-orange-600">
            {summary.completedDate}
          </p>
        </div>
      </div>

      {/* 저금통 상세 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank size={32} />
            <h3 className="text-2xl font-bold">저금통 현황</h3>
          </div>
          <p className="text-indigo-100">
            기부금 사용 내역을 투명하게 공개합니다
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 금액 상세 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">총 모금액</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(summary.totalAmount)}원
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">사용 금액</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(summary.usedAmount)}원
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({usagePercentage}% 사용)
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">잔여 금액</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatAmount(summary.remainingAmount)}원
              </p>
            </div>
          </div>

          {/* 사용률 진행바 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">기부금 사용률</span>
              <span className="text-sm font-bold text-green-600">{usagePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.expenseCount}건의 지출이 있습니다
            </p>
          </div>

          {/* 잔여금 처리 계획 */}
          {summary.remainingAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <p className="font-bold text-yellow-900 mb-2 text-lg">잔여금 처리 계획</p>
                  {summary.remainingPlan ? (
                    <p className="text-yellow-800 leading-relaxed whitespace-pre-wrap">
                      {summary.remainingPlan}
                    </p>
                  ) : (
                    <div className="space-y-2 text-yellow-800">
                      <p>• 잔여금은 다음 프로젝트에 사용될 예정입니다</p>
                      <p>• 또는 기부자 비율에 따라 환불 처리됩니다</p>
                      <p className="text-sm text-yellow-700 mt-3">
                        구체적인 처리 방안은 기관과 협의 후 결정됩니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 결산 상태 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                summary.settlementStatus === 'completed' ? 'bg-green-500' :
                summary.settlementStatus === 'in_progress' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`} />
              <span className="font-semibold text-gray-700">결산 상태</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              summary.settlementStatus === 'completed'
                ? 'bg-green-100 text-green-700' :
              summary.settlementStatus === 'in_progress'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {summary.settlementStatus === 'completed' ? '결산 완료' :
               summary.settlementStatus === 'in_progress' ? '결산 진행 중' :
               '결산 대기'}
            </span>
          </div>
        </div>
      </div>

      {/* 투명성 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <p className="font-semibold text-blue-900 mb-2">투명한 기부금 사용</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              모든 기부금은 프로젝트 목적에 맞게 사용되었으며,
              영수증과 함께 상세한 지출 내역을 공개합니다.
              <br />
              기부자 여러분의 신뢰에 보답하기 위해 투명하게 운영하겠습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementSummaryTab;
