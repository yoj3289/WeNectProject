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

  // 상태에 따른 스타일 및 라벨
  const getStatusConfig = () => {
    switch (summary.settlementStatus) {
      case 'completed':
        return {
          label: '결산 완료',
          dotColor: 'bg-green-500',
          badgeColor: 'bg-green-100 text-green-700',
        };
      case 'in_progress':
        return {
          label: '결산 진행 중',
          dotColor: 'bg-amber-500',
          badgeColor: 'bg-amber-100 text-amber-700',
        };
      case 'pending':
        return {
          label: '정산 대기 중',
          dotColor: 'bg-yellow-500',
          badgeColor: 'bg-yellow-100 text-yellow-700',
        };
      default:
        return {
          label: '정산 요청 대기중',
          dotColor: 'bg-stone-400',
          badgeColor: 'bg-stone-100 text-stone-700',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="space-y-6">
      {/* 저금통 상세 정보 */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-stone-800 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <PiggyBank size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">저금통 현황</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 금액 상세 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <p className="text-sm text-stone-600 mb-1">총 모금액</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatAmount(summary.totalAmount)}원
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <p className="text-sm text-stone-600 mb-1">사용 금액</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(summary.usedAmount)}원
              </p>
              <p className="text-xs text-stone-500 mt-1">
                ({usagePercentage}% 사용)
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <p className="text-sm text-stone-600 mb-1">잔여 금액</p>
              <p className="text-2xl font-bold text-stone-700">
                {formatAmount(summary.remainingAmount)}원
              </p>
            </div>
          </div>

          {/* 사용률 진행바 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-stone-700">기부금 사용률</span>
              <span className="text-sm font-bold text-amber-600">{usagePercentage}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-2">
              {summary.expenseCount}건의 지출이 있습니다
            </p>
          </div>

          {/* 상태 */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusConfig.dotColor}`} />
              <span className="font-semibold text-stone-700">상태</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusConfig.badgeColor}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementSummaryTab;
