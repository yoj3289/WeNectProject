import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Users, FolderKanban, Calendar, AlertCircle } from 'lucide-react';
import { useDonationTrend, useUserTrend, useProjectStats } from '../../hooks/useAdmin';
import { formatAmount } from '../../utils/formatters';

type ChartTab = 'donation' | 'user' | 'project';
type PeriodType = 'weekly' | 'monthly';

// 스켈레톤 컴포넌트
const SkeletonChart = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="h-20 bg-gray-200 rounded-lg"></div>
      <div className="h-20 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="h-80 bg-gray-100 rounded-lg"></div>
  </div>
);

// 에러 컴포넌트
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-80 text-gray-500">
    <AlertCircle size={48} className="mb-4 text-gray-400" />
    <p className="text-sm">{message}</p>
    <p className="text-xs text-gray-400 mt-2">백엔드 서버가 실행 중인지 확인하세요</p>
  </div>
);

// 데이터 없음 컴포넌트
const NoDataDisplay = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-80 text-gray-500">
    <p className="text-sm">{message}</p>
  </div>
);

// 프로젝트 상태 색상 (전체, 진행 중, 결산 중, 종료, 반려)
const PROJECT_STATUS_COLORS = {
  ongoing: '#60A5FA',     // 진행 중 - 파란색
  settlement: '#F59E0B',  // 결산 중 - 주황색
  closed: '#34D399',      // 종료 - 초록색
  rejected: '#F87171',    // 반려 - 빨간색
};

const AdminChartsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ChartTab>('donation');
  const [period, setPeriod] = useState<PeriodType>('weekly');

  // API 호출
  const { data: donationData, isLoading: isLoadingDonation, isError: isErrorDonation } = useDonationTrend(period);
  const { data: userData, isLoading: isLoadingUser, isError: isErrorUser } = useUserTrend(period);
  const { data: projectData, isLoading: isLoadingProject, isError: isErrorProject } = useProjectStats(period);

  const tabs = [
    { id: 'donation' as ChartTab, label: '기부 추이', icon: TrendingUp },
    { id: 'user' as ChartTab, label: '회원 가입 추이', icon: Users },
    { id: 'project' as ChartTab, label: '프로젝트 현황', icon: FolderKanban },
  ];

  const isCurrentLoading =
    (activeTab === 'donation' && isLoadingDonation) ||
    (activeTab === 'user' && isLoadingUser) ||
    (activeTab === 'project' && isLoadingProject);

  const isCurrentError =
    (activeTab === 'donation' && isErrorDonation) ||
    (activeTab === 'user' && isErrorUser) ||
    (activeTab === 'project' && isErrorProject);

  // 기부 차트 데이터
  const donationChartData = donationData?.data?.data || [];
  const donationTotals = {
    amount: donationData?.data?.totalAmount || 0,
    count: donationData?.data?.totalCount || 0,
  };

  // 사용자 차트 데이터
  const userChartData = userData?.data?.data || [];
  const userTotals = {
    individual: userData?.data?.totalIndividual || 0,
    organization: userData?.data?.totalOrganization || 0,
  };

  // 프로젝트 차트 데이터
  const projectChartData = projectData?.data?.trend || [];
  const projectStats = projectData?.data?.stats || {
    ongoing: 0,
    settlement: 0,
    closed: 0,
    rejected: 0,
    total: 0,
  };

  const pieData = [
    { name: '진행 중', value: projectStats.ongoing, color: PROJECT_STATUS_COLORS.ongoing },
    { name: '결산 중', value: projectStats.settlement, color: PROJECT_STATUS_COLORS.settlement },
    { name: '종료', value: projectStats.closed, color: PROJECT_STATUS_COLORS.closed },
    { name: '반려', value: projectStats.rejected, color: PROJECT_STATUS_COLORS.rejected },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* 탭 영역 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg mr-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 기간 선택 */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod('weekly')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === 'weekly'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={14} />
              주간
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === 'monthly'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={14} />
              월간
            </button>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="p-6">
        {isCurrentLoading ? (
          <SkeletonChart />
        ) : isCurrentError ? (
          <ErrorDisplay message="차트 데이터를 불러오는데 실패했습니다" />
        ) : (
          <>
            {/* 기부 추이 차트 */}
            {activeTab === 'donation' && (
              <div>
                {/* 요약 통계 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">총 기부 금액 ({period === 'weekly' ? '8주간' : '12개월'})</p>
                    <p className="text-2xl font-bold text-amber-600">{formatAmount(donationTotals.amount)}원</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">총 기부 건수</p>
                    <p className="text-2xl font-bold text-stone-600">{donationTotals.count}건</p>
                  </div>
                </div>

                {/* 차트 */}
                {donationChartData.length > 0 ? (
                  <>
                    <div style={{ width: '100%', height: 320, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={donationChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={(value) => value >= 10000 ? `${(value / 10000).toFixed(0)}만` : value}
                          />
                          <Tooltip
                            formatter={(value: number) => [`${formatAmount(value)}원`, '기부 금액']}
                            labelStyle={{ color: '#374151' }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            name="기부 금액"
                            stroke="#EF4444"
                            strokeWidth={2}
                            fill="url(#colorAmount)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 기부 건수 바 차트 */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">기부 건수</h4>
                      <div style={{ width: '100%', height: 180, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={donationChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <Tooltip />
                            <Bar dataKey="count" name="기부 건수" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <NoDataDisplay message="기부 데이터가 없습니다" />
                )}
              </div>
            )}

            {/* 회원 가입 추이 차트 */}
            {activeTab === 'user' && (
              <div>
                {/* 요약 통계 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">일반 회원 ({period === 'weekly' ? '8주간' : '12개월'})</p>
                    <p className="text-2xl font-bold text-amber-600">{userTotals.individual}명</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">기관 회원</p>
                    <p className="text-2xl font-bold text-stone-600">{userTotals.organization}명</p>
                  </div>
                </div>

                {/* 차트 */}
                {userChartData.length > 0 ? (
                  <>
                    <div style={{ width: '100%', height: 320, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="individual" name="일반 회원" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="organization" name="기관 회원" fill="#34D399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 누적 가입 추이 */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">총 가입자 추이</h4>
                      <div style={{ width: '100%', height: 180, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={userChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="total"
                              name="총 가입자"
                              stroke="#8B5CF6"
                              strokeWidth={2}
                              dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <NoDataDisplay message="회원 가입 데이터가 없습니다" />
                )}
              </div>
            )}

            {/* 프로젝트 현황 차트 */}
            {activeTab === 'project' && (
              <div>
                {/* 요약 통계 카드 */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">전체</p>
                    <p className="text-xl font-bold text-gray-800">{projectStats.total}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">진행 중</p>
                    <p className="text-xl font-bold text-blue-600">{projectStats.ongoing}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">결산 중</p>
                    <p className="text-xl font-bold text-amber-600">{projectStats.settlement}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">종료</p>
                    <p className="text-xl font-bold text-green-600">{projectStats.closed}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">반려</p>
                    <p className="text-xl font-bold text-red-500">{projectStats.rejected}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* 파이 차트 - 프로젝트 상태별 분포 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">프로젝트 상태 분포</h4>
                    {pieData.length > 0 ? (
                      <div style={{ width: '100%', height: 260, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        프로젝트 데이터가 없습니다
                      </div>
                    )}
                  </div>

                  {/* 바 차트 - 프로젝트 추이 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">프로젝트 추이 ({period === 'weekly' ? '8주간' : '12개월'})</h4>
                    {projectChartData.length > 0 ? (
                      <div style={{ width: '100%', height: 260, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="newProjects" name="신규" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="completedProjects" name="완료" fill="#34D399" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        프로젝트 추이 데이터가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChartsSection;
