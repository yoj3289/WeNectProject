import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Wallet,
  ChevronDown,
  ChevronUp,
  PieChart as PieChartIcon
} from 'lucide-react';
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
  ResponsiveContainer
} from 'recharts';
import {
  useOrganizationSummary,
  useOrganizationProjectStatistics,
  useOrganizationDonationTrends
} from '../../hooks/useStatistics';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

/**
 * 기관 프로젝트 통계 페이지
 */
const OrganizationProjectStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const { data: summary, isLoading: summaryLoading } = useOrganizationSummary();
  const { data: projectStats, isLoading: projectsLoading } = useOrganizationProjectStatistics();
  const { data: trends, isLoading: trendsLoading } = useOrganizationDonationTrends(selectedProjectId, period);

  const formatAmount = (amount: number): string => {
    return Math.floor(amount).toLocaleString('ko-KR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: '진행중', className: 'bg-green-100 text-green-700' };
      case 'COMPLETED':
        return { label: '모금완료', className: 'bg-blue-100 text-blue-700' };
      case 'SETTLEMENT':
        return { label: '결산중', className: 'bg-amber-100 text-amber-700' };
      case 'CLOSED':
        return { label: '종료', className: 'bg-stone-100 text-stone-700' };
      default:
        return { label: status, className: 'bg-stone-100 text-stone-700' };
    }
  };

  if (summaryLoading || projectsLoading) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="프로젝트 통계를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* 다크 헤더 */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/organization/dashboard')}
              className="p-2 hover:bg-stone-800 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg sm:rounded-xl">
                <BarChart3 className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">프로젝트 통계</h1>
                <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                  기관의 프로젝트 기부 현황을 확인하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* 전체 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <Target className="text-amber-500 w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-stone-600">총 프로젝트</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-stone-900">
              {summary?.totalProjects || 0}개
            </p>
            <p className="text-xs text-stone-500 mt-1">
              진행 {summary?.activeProjects || 0} / 완료 {(summary?.completedProjects || 0) + (summary?.closedProjects || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <Wallet className="text-green-500 w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-stone-600">총 기부액</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {formatAmount(summary?.totalDonationAmount || 0)}원
            </p>
            <p className="text-xs text-stone-500 mt-1">
              평균 달성률 {summary?.averageAchievementRate?.toFixed(1) || 0}%
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Users className="text-blue-500 w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-stone-600">총 기부자</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {summary?.totalDonorCount || 0}명
            </p>
            <p className="text-xs text-stone-500 mt-1">
              총 {summary?.totalDonationCount || 0}건의 기부
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <TrendingUp className="text-purple-500 w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-stone-600">평균 기부액</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {formatAmount(summary?.averageDonation || 0)}원
            </p>
            <p className="text-xs text-stone-500 mt-1">1회 기부 평균</p>
          </div>
        </div>

        {/* 기부 트렌드 차트 */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-stone-900">기부 트렌드</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">전체 프로젝트</option>
                {projectStats?.map(project => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.projectTitle}
                  </option>
                ))}
              </select>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="weekly">주별</option>
                <option value="monthly">월별</option>
                <option value="yearly">연별</option>
              </select>
            </div>
          </div>

          {trendsLoading ? (
            <div className="py-12">
              <LoadingSpinner size="md" message="트렌드 데이터 로딩 중..." />
            </div>
          ) : trends && trends.length > 0 ? (
            <div className="space-y-6">
              {/* Line Chart - 기부 금액 추이 */}
              <div>
                <h3 className="text-sm font-medium text-stone-600 mb-3">기부 금액 추이</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[...trends].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 12, fill: '#78716c' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#78716c' }}
                      tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${formatAmount(value)}원`, '기부 금액']}
                      labelStyle={{ color: '#1c1917' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalAmount"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#d97706' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - 기부 건수 & 기부자 수 */}
              <div>
                <h3 className="text-sm font-medium text-stone-600 mb-3">기부 건수 및 기부자 수</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...trends].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 12, fill: '#78716c' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#78716c' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e7e5e4',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="donationCount" name="기부 건수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="donorCount" name="기부자 수" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">기부 내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 프로젝트 분석 차트 - 2단 그리드 */}
        {projectStats && projectStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 프로젝트 상태 분포 - Pie Chart */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-stone-900">프로젝트 상태 분포</h2>
              </div>
              {(() => {
                const statusCount = projectStats.reduce((acc, p) => {
                  acc[p.status] = (acc[p.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const statusData = Object.entries(statusCount).map(([status, count]) => ({
                  name: getStatusBadge(status).label,
                  value: count,
                  status
                }));

                const statusColors: Record<string, string> = {
                  'ACTIVE': '#10b981',
                  'COMPLETED': '#3b82f6',
                  'SETTLEMENT': '#f59e0b',
                  'CLOSED': '#78716c'
                };

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={statusColors[entry.status] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}개`, '프로젝트 수']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e7e5e4',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-stone-600">진행중</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-stone-600">모금완료</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-stone-600">결산중</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-500" />
                  <span className="text-xs text-stone-600">종료</span>
                </div>
              </div>
            </div>

            {/* 프로젝트별 기부 금액 비교 - Bar Chart */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-stone-900">프로젝트별 기부 금액</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={projectStats.slice(0, 6).map(p => ({
                    name: p.projectTitle.length > 10 ? p.projectTitle.slice(0, 10) + '...' : p.projectTitle,
                    현재금액: p.currentAmount,
                    목표금액: p.targetAmount
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${formatAmount(value)}원`]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="현재금액" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="목표금액" fill="#e7e5e4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 프로젝트별 통계 */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200">
          <h2 className="text-lg font-bold text-stone-900 mb-4">프로젝트별 상세 통계</h2>

          {projectStats && projectStats.length > 0 ? (
            <div className="space-y-3">
              {projectStats.map(project => {
                const isExpanded = expandedProject === project.projectId;
                const statusBadge = getStatusBadge(project.status);

                return (
                  <div
                    key={project.projectId}
                    className="border border-stone-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedProject(isExpanded ? null : project.projectId)}
                      className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        <span className="font-medium text-stone-900 text-left line-clamp-1">
                          {project.projectTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-500 hidden sm:inline">
                          달성률 {project.achievementRate.toFixed(1)}%
                        </span>
                        <span className="font-bold text-amber-600">
                          {formatAmount(project.currentAmount)}원
                        </span>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-stone-200 bg-stone-50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                          <div>
                            <p className="text-xs text-stone-500 mb-1">목표 금액</p>
                            <p className="font-bold text-stone-900">{formatAmount(project.targetAmount)}원</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">현재 모금액</p>
                            <p className="font-bold text-amber-600">{formatAmount(project.currentAmount)}원</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">기부자 수</p>
                            <p className="font-bold text-blue-600">{project.donorCount}명</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">기부 건수</p>
                            <p className="font-bold text-green-600">{project.donationCount}건</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">평균 기부액</p>
                            <p className="font-bold text-purple-600">{formatAmount(project.averageDonation)}원</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">달성률</p>
                            <p className="font-bold text-stone-900">{project.achievementRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">카테고리</p>
                            <p className="font-medium text-stone-700">{project.categoryName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500 mb-1">기간</p>
                            <p className="font-medium text-stone-700 text-sm">
                              {project.startDate} ~ {project.endDate}
                            </p>
                          </div>
                        </div>

                        {/* 진행률 바 */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span>진행률</span>
                            <span>{Math.min(project.achievementRate, 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                              style={{ width: `${Math.min(project.achievementRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">등록된 프로젝트가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationProjectStatisticsPage;
