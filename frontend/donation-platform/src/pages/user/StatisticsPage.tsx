import React, { useState } from 'react';
import { ChevronLeft, Loader2, Heart, TrendingUp, PieChart, Calendar, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  useDonationTrends,
  useCategoryAnalysis,
  useDonationTimeline,
  useFavoriteCategoryDistribution,
} from '../../hooks/useStatistics';

interface StatisticsPageProps {
  onBack: () => void;
}

const COLORS = ['#f59e0b', '#ea580c', '#dc2626', '#c026d3', '#7c3aed', '#2563eb', '#0891b2', '#059669'];

const StatisticsPage: React.FC<StatisticsPageProps> = ({ onBack }) => {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { data: donationTrends, isLoading: isTrendsLoading, error: trendsError } = useDonationTrends(period, period === 'monthly' ? year : undefined);
  const { data: categoryAnalysis, isLoading: isCategoryLoading, error: categoryError } = useCategoryAnalysis();
  const { data: donationTimeline, isLoading: isTimelineLoading, error: timelineError } = useDonationTimeline();
  const { data: favoriteCategoryDistribution, isLoading: isFavoriteLoading, error: favoriteError } = useFavoriteCategoryDistribution();

  // 에러 처리
  React.useEffect(() => {
    if (trendsError) toast.error('기부 트렌드 조회 실패');
    if (categoryError) toast.error('카테고리 분석 조회 실패');
    if (timelineError) toast.error('기부 타임라인 조회 실패');
    if (favoriteError) toast.error('관심 카테고리 조회 실패');
  }, [trendsError, categoryError, timelineError, favoriteError]);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 차트 데이터 포맷
  const trendsChartData = donationTrends?.map(item => ({
    period: item.period,
    amount: Number(item.totalAmount),
    count: item.donationCount,
  })) || [];

  const categoryChartData = categoryAnalysis?.map(item => ({
    name: item.categoryName,
    value: Number(item.totalAmount),
    percentage: item.percentage,
  })) || [];

  const timelineChartData = donationTimeline?.slice(0, 10).reverse().map(item => ({
    date: formatDate(item.donatedAt),
    amount: Number(item.amount),
    project: item.projectTitle,
  })) || [];

  const favoriteChartData = favoriteCategoryDistribution?.map(item => ({
    name: item.categoryName,
    value: item.projectCount,
    percentage: item.percentage,
  })) || [];

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <button
            onClick={onBack}
            className="mb-4 text-stone-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={16} />
            마이페이지로
          </button>
          <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-3">Statistics</p>
          <h1 className="text-2xl md:text-3xl text-white font-light">
            나의 <span className="font-medium">기부 통계</span>
          </h1>
          <p className="text-stone-400 text-sm mt-2">
            기부 활동을 한눈에 확인하세요
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {/* 1. 내 기부 통계 (트렌드) */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <TrendingUp size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-600 uppercase tracking-[0.15em] text-xs">Donation Trends</p>
                  <h2 className="text-lg font-light text-stone-800">
                    내 <span className="font-medium">기부 통계</span>
                  </h2>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
                  <button
                    onClick={() => setPeriod('monthly')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      period === 'monthly'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    월별
                  </button>
                  <button
                    onClick={() => setPeriod('yearly')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      period === 'yearly'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    연도별
                  </button>
                </div>
                {period === 'monthly' && (
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                  >
                    {[...Array(5)].map((_, i) => {
                      const y = new Date().getFullYear() - i;
                      return <option key={y} value={y}>{y}년</option>;
                    })}
                  </select>
                )}
              </div>
            </div>

            {isTrendsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : trendsChartData.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="text-stone-300" size={32} />
                </div>
                <p className="text-stone-500">통계 데이터가 없습니다.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="period" stroke="#78716c" style={{ fontSize: '12px' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#f59e0b"
                    style={{ fontSize: '12px' }}
                    label={{ value: '금액 (원)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#78716c' } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0891b2"
                    style={{ fontSize: '12px' }}
                    label={{ value: '건수 (건)', angle: 90, position: 'insideRight', style: { fontSize: '11px', fill: '#78716c' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === '기부 금액') {
                        return `${formatAmount(value)}원`;
                      }
                      return `${value}건`;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="기부 금액"
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#0891b2"
                    strokeWidth={2}
                    name="기부 건수"
                    dot={{ fill: '#0891b2', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 2개 차트를 가로로 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2. 기부 카테고리 분석 */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <PieChart size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-600 uppercase tracking-[0.15em] text-xs">Category Analysis</p>
                  <h2 className="text-lg font-light text-stone-800">
                    카테고리 <span className="font-medium">분석</span>
                  </h2>
                </div>
              </div>

              {isCategoryLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : categoryChartData.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                    <PieChart className="text-stone-300" size={32} />
                  </div>
                  <p className="text-stone-500">통계 데이터가 없습니다.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e7e5e4',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => `${formatAmount(value)}원`}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {categoryAnalysis?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-stone-600">{item.categoryName}</span>
                        </div>
                        <span className="font-medium text-stone-800">{formatAmount(Number(item.totalAmount))}원</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 3. 관심 프로젝트 카테고리 분포 */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Heart size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-600 uppercase tracking-[0.15em] text-xs">Favorite Projects</p>
                  <h2 className="text-lg font-light text-stone-800">
                    관심 프로젝트 <span className="font-medium">분석</span>
                  </h2>
                </div>
              </div>

              {isFavoriteLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : favoriteChartData.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                    <Heart className="text-stone-300" size={32} />
                  </div>
                  <p className="text-stone-500">통계 데이터가 없습니다.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartsPieChart>
                      <Pie
                        data={favoriteChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {favoriteChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e7e5e4',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => `${value}개 프로젝트`}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {favoriteCategoryDistribution?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-stone-600">{item.categoryName}</span>
                        </div>
                        <span className="font-medium text-stone-800">{item.projectCount}개</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4. 기부 히스토리 차트 */}
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-amber-600 uppercase tracking-[0.15em] text-xs">Donation Timeline</p>
                <h2 className="text-lg font-light text-stone-800">
                  기부 <span className="font-medium">히스토리</span>
                </h2>
              </div>
            </div>

            {isTimelineLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : timelineChartData.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                  <Calendar className="text-stone-300" size={32} />
                </div>
                <p className="text-stone-500">통계 데이터가 없습니다.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" stroke="#78716c" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#78716c" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => `${formatAmount(value)}원`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="amount" fill="#f59e0b" name="기부 금액" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatisticsPage;
