import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, Clock, FileText, ArrowUp, ArrowDown, Heart, Building2, Wallet, Receipt, ChevronDown, ChevronUp, Home, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminDashboardProps } from '../../types/admin';
import SystemMonitoringDashboard from './SystemMonitoringDashboard';
import AdminChartsSection from './AdminChartsSection';
import { useAdminDashboard, useCategoryDistribution, useOrganizationApprovals, useAdminSettlements } from '../../hooks/useAdmin';
import { useRecentDonations, useToggleFeatured } from '../../hooks/useDonations';
import { useExpensesByStatus } from '../../hooks/useExpenses';
import { formatAmount } from '../../utils/formatters';

type ActivityTab = 'donations' | 'organizations' | 'settlements' | 'expenses';

interface DashboardPageProps extends AdminDashboardProps {
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  adminUsers: any[];
}

// 스켈레톤 컴포넌트들
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="w-16 h-5 bg-gray-200 rounded"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-16"></div>
  </div>
);

const SkeletonTableRow = ({ cols }: { cols: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, idx) => (
      <td key={idx} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </td>
    ))}
  </tr>
);

const INITIAL_DISPLAY_COUNT = 5;

const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveMenu,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActivityTab>('donations');
  const [expandedTabs, setExpandedTabs] = useState<Record<ActivityTab, boolean>>({
    donations: false,
    organizations: false,
    settlements: false,
    expenses: false,
  });

  // 메뉴 이동 핸들러 (setActiveMenu + navigate)
  const handleNavigate = (menuId: string) => {
    setActiveMenu(menuId);
    navigate(`/admin/${menuId}`);
  };

  // Featured 토글 mutation
  const toggleFeaturedMutation = useToggleFeatured();

  const handleToggleFeatured = (donationId: number, currentIsFeatured: boolean) => {
    toggleFeaturedMutation.mutate(
      { donationId, isFeatured: !currentIsFeatured },
      {
        onSuccess: () => {
          toast.success(!currentIsFeatured ? '홈페이지 노출로 설정되었습니다.' : '홈페이지 노출이 해제되었습니다.');
        },
        onError: (error: any) => {
          toast.error(error.message || '설정 변경에 실패했습니다.');
        },
      }
    );
  };

  // API 호출 - 관리자 대시보드 데이터
  const { data: dashboardData, isLoading: isLoadingDashboard, isError: isErrorDashboard } = useAdminDashboard();
  const { data: categoryData, isLoading: isLoadingCategory } = useCategoryDistribution();
  const { data: recentDonations, isLoading: isLoadingDonations } = useRecentDonations(10);
  const { data: organizationApprovals, isLoading: isLoadingOrganizations } = useOrganizationApprovals({ status: 'pending' });
  const { data: settlementsData, isLoading: isLoadingSettlements } = useAdminSettlements({ status: 'pending', size: 10 });
  const { data: pendingExpenses, isLoading: isLoadingExpenses } = useExpensesByStatus('PENDING');

  const stats = dashboardData?.data || {
    todayDonation: 0,
    donationChange: 0,
    newUsers: 0,
    userChange: 0,
    pendingApprovals: 0,
    pendingSettlements: 0,
    pendingExpenses: 0
  };

  const categories = categoryData?.data || [];
  const donations = recentDonations || [];
  const organizations = organizationApprovals?.content || [];
  const settlements = settlementsData?.content || [];
  const expenses = pendingExpenses || [];

  const tabs = [
    { id: 'donations' as ActivityTab, label: '최근 기부', icon: Heart, count: donations.length, isLoading: isLoadingDonations },
    { id: 'organizations' as ActivityTab, label: '기관 승인 요청', icon: Building2, count: organizations.length, isLoading: isLoadingOrganizations },
    { id: 'settlements' as ActivityTab, label: '정산 요청', icon: Wallet, count: settlements.length, isLoading: isLoadingSettlements },
    { id: 'expenses' as ActivityTab, label: '지출 승인 요청', icon: Receipt, count: expenses.length, isLoading: isLoadingExpenses },
  ];

  // 현재 탭의 로딩 상태
  const isCurrentTabLoading = tabs.find(t => t.id === activeTab)?.isLoading;

  return (
    <div className="p-8 space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
        <p className="text-sm text-gray-600 mt-1">전체 시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-6">
        {isLoadingDashboard ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isErrorDashboard ? (
          <div className="col-span-5 bg-red-50 rounded-xl p-6 border border-red-200 text-center">
            <p className="text-red-600 mb-2">통계 데이터를 불러오는데 실패했습니다.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-red-700 hover:text-red-800 underline"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-red-600" size={24} />
                </div>
                <span className={`flex items-center gap-1 text-sm font-semibold ${stats.donationChange >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {stats.donationChange >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(stats.donationChange).toFixed(1)}%
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">오늘 기부 금액</p>
              <p className="text-3xl font-bold text-gray-800">{formatAmount(stats.todayDonation)}원</p>
              <p className="text-xs text-gray-500 mt-2">전일 대비</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
                  <Users className="text-pink-600" size={24} />
                </div>
                <span className={`flex items-center gap-1 text-sm font-semibold ${stats.userChange >= 0 ? 'text-pink-600' : 'text-blue-600'}`}>
                  {stats.userChange >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(stats.userChange).toFixed(1)}%
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">신규 회원</p>
              <p className="text-3xl font-bold text-gray-800">{stats.newUsers}명</p>
              <p className="text-xs text-gray-500 mt-2">이번 주</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('organizations')}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-orange-600" size={24} />
                </div>
                <button className="text-red-600 hover:text-red-700 font-semibold text-sm">
                  보기 →
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-1">승인 대기</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pendingApprovals}건</p>
              <p className="text-xs text-gray-500 mt-2">기관 가입 신청</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('settlements')}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-rose-600" size={24} />
                </div>
                <button className="text-pink-600 hover:text-pink-700 font-semibold text-sm">
                  보기 →
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-1">정산 요청</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pendingSettlements}건</p>
              <p className="text-xs text-gray-500 mt-2">처리 대기중</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('expenses')}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  보기 →
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-1">지출 승인 대기</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pendingExpenses}건</p>
              <p className="text-xs text-gray-500 mt-2">검토 필요</p>
            </div>
          </>
        )}
      </div>

      {/* 최근 활동 섹션 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">최근 활동</h2>
        <p className="text-sm text-gray-500 mb-4">최근 일주일간의 주요 활동 내역입니다</p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.isLoading ? (
                  <span className="w-6 h-5 bg-gray-200 rounded-full animate-pulse"></span>
                ) : tab.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* 최근 기부 탭 */}
          {activeTab === 'donations' && (
            <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기부자</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">메시지</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">금액</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">홈 노출</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isCurrentTabLoading ? (
                  <>
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                    <SkeletonTableRow cols={6} />
                  </>
                ) : donations.length > 0 ? (
                  (expandedTabs.donations ? donations : donations.slice(0, INITIAL_DISPLAY_COUNT)).map((donation: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{donation.donorName}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-[150px] truncate">{donation.projectTitle}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px]">
                        {donation.message ? (
                          <span className="truncate block" title={donation.message}>
                            {donation.message.length > 30 ? `${donation.message.substring(0, 30)}...` : donation.message}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 font-semibold">{formatAmount(donation.amount)}원</td>
                      <td className="px-6 py-4 text-center">
                        {donation.message ? (
                          <button
                            onClick={() => handleToggleFeatured(donation.donationId, donation.isFeatured)}
                            disabled={toggleFeaturedMutation.isPending}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              donation.isFeatured
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                            title={donation.isFeatured ? '홈페이지 노출 해제' : '홈페이지에 노출'}
                          >
                            {donation.isFeatured ? (
                              <>
                                <Star size={12} className="fill-amber-500" />
                                노출중
                              </>
                            ) : (
                              <>
                                <Home size={12} />
                                노출
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">메시지 없음</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-sm">
                        {new Date(donation.timestamp).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      최근 기부 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {donations.length > INITIAL_DISPLAY_COUNT && (
              <div className="border-t border-gray-200 px-6 py-3 text-center">
                <button
                  onClick={() => setExpandedTabs(prev => ({ ...prev, donations: !prev.donations }))}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-amber-600 font-medium"
                >
                  {expandedTabs.donations ? (
                    <>접기 <ChevronUp size={16} /></>
                  ) : (
                    <>더보기 ({donations.length - INITIAL_DISPLAY_COUNT}건) <ChevronDown size={16} /></>
                  )}
                </button>
              </div>
            )}
            </>
          )}

          {/* 기관 승인 요청 탭 */}
          {activeTab === 'organizations' && (
            <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기관명</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">대표자</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">사업자번호</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">신청일</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isCurrentTabLoading ? (
                  <>
                    <SkeletonTableRow cols={5} />
                    <SkeletonTableRow cols={5} />
                    <SkeletonTableRow cols={5} />
                  </>
                ) : organizations.length > 0 ? (
                  (expandedTabs.organizations ? organizations : organizations.slice(0, INITIAL_DISPLAY_COUNT)).map((org: any) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{org.organizationName}</td>
                      <td className="px-6 py-4 text-gray-600">{org.representativeName}</td>
                      <td className="px-6 py-4 text-gray-600">{org.businessNumber}</td>
                      <td className="px-6 py-4 text-right text-gray-500 text-sm">
                        {new Date(org.appliedDate).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleNavigate('organizations')}
                          className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                        >
                          검토하기
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      대기 중인 기관 승인 요청이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {organizations.length > INITIAL_DISPLAY_COUNT && (
              <div className="border-t border-gray-200 px-6 py-3 text-center">
                <button
                  onClick={() => setExpandedTabs(prev => ({ ...prev, organizations: !prev.organizations }))}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-amber-600 font-medium"
                >
                  {expandedTabs.organizations ? (
                    <>접기 <ChevronUp size={16} /></>
                  ) : (
                    <>더보기 ({organizations.length - INITIAL_DISPLAY_COUNT}건) <ChevronDown size={16} /></>
                  )}
                </button>
              </div>
            )}
            </>
          )}

          {/* 정산 요청 탭 */}
          {activeTab === 'settlements' && (
            <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">예금주</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">정산금액</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isCurrentTabLoading ? (
                  <>
                    <SkeletonTableRow cols={5} />
                    <SkeletonTableRow cols={5} />
                    <SkeletonTableRow cols={5} />
                  </>
                ) : settlements.length > 0 ? (
                  (expandedTabs.settlements ? settlements : settlements.slice(0, INITIAL_DISPLAY_COUNT)).map((settlement: any) => (
                    <tr key={settlement.settlementId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(settlement.requestedAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 max-w-xs truncate">{settlement.projectTitle}</td>
                      <td className="px-6 py-4 text-gray-600">{settlement.accountHolder}</td>
                      <td className="px-6 py-4 text-right text-gray-800 font-semibold">{formatAmount(settlement.settlementAmount)}원</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleNavigate('settlements')}
                          className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                        >
                          검토하기
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      대기 중인 정산 요청이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {settlements.length > INITIAL_DISPLAY_COUNT && (
              <div className="border-t border-gray-200 px-6 py-3 text-center">
                <button
                  onClick={() => setExpandedTabs(prev => ({ ...prev, settlements: !prev.settlements }))}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-amber-600 font-medium"
                >
                  {expandedTabs.settlements ? (
                    <>접기 <ChevronUp size={16} /></>
                  ) : (
                    <>더보기 ({settlements.length - INITIAL_DISPLAY_COUNT}건) <ChevronDown size={16} /></>
                  )}
                </button>
              </div>
            )}
            </>
          )}

          {/* 지출 승인 요청 탭 */}
          {activeTab === 'expenses' && (
            <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">지출일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">카테고리</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">금액</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isCurrentTabLoading ? (
                  <>
                    <SkeletonTableRow cols={5} />
                    <SkeletonTableRow cols={5} />
                    <SkeletonTableRow cols={5} />
                  </>
                ) : expenses.length > 0 ? (
                  (expandedTabs.expenses ? expenses : expenses.slice(0, INITIAL_DISPLAY_COUNT)).map((expense: any) => (
                    <tr key={expense.expenseId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(expense.expenseDate).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 max-w-xs truncate">
                        {expense.projectTitle || `프로젝트 #${expense.projectId}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 font-semibold">{formatAmount(expense.amount)}원</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleNavigate('expenses')}
                          className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                        >
                          검토하기
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      대기 중인 지출 승인 요청이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {expenses.length > INITIAL_DISPLAY_COUNT && (
              <div className="border-t border-gray-200 px-6 py-3 text-center">
                <button
                  onClick={() => setExpandedTabs(prev => ({ ...prev, expenses: !prev.expenses }))}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-amber-600 font-medium"
                >
                  {expandedTabs.expenses ? (
                    <>접기 <ChevronUp size={16} /></>
                  ) : (
                    <>더보기 ({expenses.length - INITIAL_DISPLAY_COUNT}건) <ChevronDown size={16} /></>
                  )}
                </button>
              </div>
            )}
            </>
          )}
        </div>
        </div>
      </div>

      {/* 통계 리포트 섹션 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">통계 리포트</h2>
        <p className="text-sm text-gray-500 mb-4">기부, 회원, 프로젝트 현황을 한눈에 확인하세요</p>
        <AdminChartsSection />
      </div>

      {/* 카테고리별 프로젝트 분포 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">카테고리별 프로젝트 분포</h2>
        <p className="text-sm text-gray-500 mb-4">카테고리별 프로젝트 현황을 확인하세요</p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-3">
          {isLoadingCategory ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))}
            </>
          ) : categories.length > 0 ? (
            categories.map((cat: any) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                  <span className="text-sm text-gray-600 font-semibold">{cat.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">카테고리 데이터가 없습니다.</p>
          )}
        </div>
        </div>
      </div>

      {/* 시스템 모니터링 */}
      <div className="mt-8">
        <SystemMonitoringDashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
