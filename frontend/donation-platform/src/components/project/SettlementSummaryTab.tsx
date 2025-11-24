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
      {/* 저금통 상세 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank size={32} />
            <h3 className="text-2xl font-bold">저금통 현황</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 금액 상세 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-300">
              <p className="text-sm text-gray-900 mb-1">총 모금액</p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(summary.totalAmount)}원
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-300">
              <p className="text-sm text-gray-900 mb-1">사용 금액</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(summary.usedAmount)}원
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({usagePercentage}% 사용)
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-300">
              <p className="text-sm text-gray-900 mb-1">잔여 금액</p>
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

          {/* 상태 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                summary.settlementStatus === 'completed' ? 'bg-green-500' :
                summary.settlementStatus === 'in_progress' ? 'bg-green-500' :
                summary.settlementStatus === 'pending' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`} />
              <span className="font-semibold text-gray-700">상태</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              summary.settlementStatus === 'completed'
                ? 'bg-green-100 text-green-700' :
              summary.settlementStatus === 'in_progress'
                ? 'bg-green-100 text-green-700' :
              summary.settlementStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {summary.settlementStatus === 'completed' ? '결산 완료' :
               summary.settlementStatus === 'in_progress' ? '결산 진행 중' :
               summary.settlementStatus === 'pending' ? '정산 대기 중' :
               '정산 요청 대기중'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementSummaryTab;
