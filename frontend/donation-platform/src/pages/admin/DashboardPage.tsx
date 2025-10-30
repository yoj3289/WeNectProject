import React from 'react';
import { DollarSign, Users, Clock, FileText, ArrowUp, Loader } from 'lucide-react';
import type { AdminDashboardProps } from '../../types/admin';
import SystemMonitoringDashboard from './SystemMonitoringDashboard';
import { useAdminDashboard, useCategoryDistribution } from '../../hooks/useAdmin';
import { formatAmount } from '../../utils/formatters';

interface DashboardPageProps extends AdminDashboardProps {
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  adminUsers: any[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  setActiveMenu,
  setSelectedProject,
  setShowProjectModal,
}) => {
  // API 호출 - 관리자 대시보드 데이터
  const { data: dashboardData, isLoading, isError } = useAdminDashboard();
  const { data: categoryData } = useCategoryDistribution();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-red-500" size={48} />
      </div>
    );
  }

  // 에러 상태
  if (isError || !dashboardData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">대시보드 데이터를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData.stats || {
    todayDonation: 0,
    donationChange: 0,
    newUsers: 0,
    userChange: 0,
    pendingApprovals: 0,
    pendingSettlements: 0
  };

  const recentProjects = dashboardData.recentProjects || [];
  const weeklyDonations = dashboardData.weeklyDonations || [65, 85, 72, 90, 78, 95, 88];
  const categories = categoryData || [
    { name: '아동·청소년', percent: 35, color: 'bg-red-500' },
    { name: '어르신', percent: 25, color: 'bg-pink-500' },
    { name: '장애인', percent: 20, color: 'bg-rose-500' },
    { name: '환경보호', percent: 15, color: 'bg-orange-500' },
    { name: '기타', percent: 5, color: 'bg-amber-500' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
        <p className="text-sm text-gray-600 mt-1">전체 시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-red-600" size={24} />
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
              <ArrowUp size={16} />
              {stats.donationChange}%
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
            <span className="flex items-center gap-1 text-sm font-semibold text-pink-600">
              <ArrowUp size={16} />
              {stats.userChange}%
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">신규 회원</p>
          <p className="text-3xl font-bold text-gray-800">{stats.newUsers}명</p>
          <p className="text-xs text-gray-500 mt-2">이번 주</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveMenu('projects')}>
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
          <p className="text-xs text-gray-500 mt-2">프로젝트</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveMenu('settlements')}>
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
      </div>

      {/* 최근 프로젝트 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">승인 대기 프로젝트</h3>
          <button
            onClick={() => setActiveMenu('projects')}
            className="text-sm text-red-500 hover:text-red-600 font-semibold"
          >
            전체보기 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트명</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기관</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">목표금액</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentProjects.filter((p: any) => p.status === 'pending').slice(0, 5).map((project: any) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{project.title}</td>
                  <td className="px-6 py-4 text-gray-600">{project.organization}</td>
                  <td className="px-6 py-4 text-gray-800 font-semibold">{formatAmount(project.targetAmount)}원</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{project.createdAt}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      대기중
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectModal(true);
                      }}
                      className="text-red-500 hover:text-red-600 font-semibold text-sm hover:underline"
                    >
                      검토하기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">주간 기부 추이</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {weeklyDonations.map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-red-500 to-pink-500 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">
                  {['월', '화', '수', '목', '금', '토', '일'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">카테고리별 분포</h3>
          <div className="space-y-4">
            {categories.map((cat: any) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                  <span className="text-sm text-gray-600 font-semibold">{cat.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${cat.color} h-2 rounded-full transition-all`}
                    style={{ width: `${cat.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
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
