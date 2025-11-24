import React from 'react';
import { Calendar, TrendingUp, FileCheck, CheckCircle, XCircle, Receipt, DollarSign } from 'lucide-react';
import type { Project, Expense, SettlementSummary } from '../../types';

interface ProjectTimelineProps {
  project: Project;
  expenses?: Expense[];
  settlement?: SettlementSummary | null;
}

interface TimelineEvent {
  id: string;
  type: 'start' | 'milestone' | 'completed' | 'settlement_request' | 'settlement_approved' | 'settlement_rejected' | 'expense' | 'closed' | 'future';
  title: string;
  date: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  amount?: number;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ project, expenses = [], settlement }) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  // 타임라인 이벤트 생성
  const generateTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // 1. 프로젝트 시작
    events.push({
      id: 'start',
      type: 'start',
      title: '프로젝트 시작',
      date: project.startDate || project.createdAt || '2024-01-01',
      icon: <Calendar size={20} />,
      color: 'bg-blue-500',
    });

    // 2. 50% 달성 (진행 중인 경우)
    const progress = Math.round((project.currentAmount / project.targetAmount) * 100);
    if (progress >= 50) {
      events.push({
        id: 'milestone-50',
        type: 'milestone',
        title: '50% 달성',
        date: new Date().toISOString().split('T')[0], // 임시 날짜
        description: `목표의 절반을 달성했습니다`,
        icon: <TrendingUp size={20} />,
        color: 'bg-purple-500',
      });
    }

    // 3. 모금 완료 (COMPLETED, SETTLEMENT, CLOSED 상태)
    const isCompleted = ['completed', 'settlement', 'closed'].includes(project.status?.toLowerCase() || '');
    if (isCompleted) {
      events.push({
        id: 'completed',
        type: 'completed',
        title: '모금 완료',
        date: project.endDate || new Date().toISOString().split('T')[0],
        description: `최종 모금액: ${formatAmount(project.currentAmount)}원`,
        icon: <CheckCircle size={20} />,
        color: 'bg-green-500',
        amount: project.currentAmount,
      });

      // 4. 정산 요청 (SETTLEMENT, CLOSED 상태)
      const isSettlement = ['settlement', 'closed'].includes(project.status?.toLowerCase() || '');
      if (isSettlement) {
        events.push({
          id: 'settlement-request',
          type: 'settlement_request',
          title: '정산 요청',
          date: settlement?.completedDate || new Date().toISOString().split('T')[0],
          description: '기관이 정산을 요청했습니다',
          icon: <FileCheck size={20} />,
          color: 'bg-yellow-500',
        });

        // 5. 정산 승인
        events.push({
          id: 'settlement-approved',
          type: 'settlement_approved',
          title: '정산 승인',
          date: settlement?.completedDate || new Date().toISOString().split('T')[0],
          description: '관리자가 정산을 승인했습니다',
          icon: <CheckCircle size={20} />,
          color: 'bg-green-500',
        });

        // 6. 지출 내역 (승인된 것만)
        const approvedExpenses = expenses.filter(e => e.status === 'APPROVED');
        approvedExpenses.forEach((expense, index) => {
          events.push({
            id: `expense-${expense.expenseId}`,
            type: 'expense',
            title: `지출 승인: ${expense.category}`,
            date: expense.approvedAt || expense.expenseDate,
            description: expense.description,
            icon: <Receipt size={20} />,
            color: 'bg-orange-500',
            amount: expense.amount,
          });
        });

        // 7. 프로젝트 종료 (CLOSED 상태)
        if (project.status?.toLowerCase() === 'closed') {
          events.push({
            id: 'closed',
            type: 'closed',
            title: '프로젝트 종료',
            date: new Date().toISOString().split('T')[0],
            description: '프로젝트가 성공적으로 완료되었습니다',
            icon: <CheckCircle size={20} />,
            color: 'bg-gray-600',
          });
        }
      }
    } else {
      // 진행 중인 프로젝트: 미래 이벤트 표시
      events.push({
        id: 'future-goal',
        type: 'future',
        title: '목표 달성 예상',
        date: project.endDate || '2024-12-31',
        description: `D-${project.dday}`,
        icon: <TrendingUp size={20} />,
        color: 'bg-gray-300',
      });
    }

    // 날짜순 정렬
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineEvents = generateTimeline();

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h4 className="font-bold text-lg mb-4">프로젝트 타임라인</h4>

      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const isFuture = event.type === 'future';
          const isLast = index === timelineEvents.length - 1;

          return (
            <div key={event.id} className="flex items-start gap-4">
              {/* 타임라인 라인 */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${event.color} ${isFuture ? 'opacity-40' : ''} flex items-center justify-center text-white flex-shrink-0`}>
                  {event.icon}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-12 ${isFuture ? 'bg-gray-200' : 'bg-gray-300'} mt-2`}></div>
                )}
              </div>

              {/* 이벤트 정보 */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className={`font-bold ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>
                      {event.title}
                    </p>
                    <p className={`text-sm ${isFuture ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
                      {formatDate(event.date)}
                    </p>
                    {event.description && (
                      <p className={`text-sm ${isFuture ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                        {event.description}
                      </p>
                    )}
                    {event.amount && event.amount > 0 && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                          event.type === 'expense'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          <DollarSign size={14} />
                          {formatAmount(event.amount)}원
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 타임라인 요약 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">진행 단계</p>
            <p className="text-sm font-bold text-blue-600">
              {timelineEvents.filter(e => e.type !== 'future').length}개 완료
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">모금액</p>
            <p className="text-sm font-bold text-green-600">
              {formatAmount(project.currentAmount)}원
            </p>
          </div>
          {settlement && (
            <>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">지출 건수</p>
                <p className="text-sm font-bold text-orange-600">
                  {settlement.expenseCount}건
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">잔여 금액</p>
                <p className="text-sm font-bold text-purple-600">
                  {formatAmount(settlement.remainingAmount)}원
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
