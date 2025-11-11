import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, CheckCircle, Eye, Award, Heart, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Loader2 } from 'lucide-react';
import type { UserType } from '../types';
import { getCategoryLabel } from '../types';
import { usePopularProjects } from '../hooks/useProjects';
import { useRecentDonations } from '../hooks/useDonations';
import { useStatisticsSummary } from '../hooks/useStatistics';
import { formatAmount, calculatePercentage } from '../utils/formatters';

interface HomePageProps {
  isLoggedIn: boolean;
  userType: UserType;
}

const HomePage: React.FC<HomePageProps> = ({
  isLoggedIn,
  userType,
}) => {
  const navigate = useNavigate();
  // ✅ API 호출로 데이터 가져오기 (하드코딩 제거!)
  const { data: projects, isLoading: projectsLoading } = usePopularProjects(4);
  const { data: recentDonations, isLoading: donationsLoading } = useRecentDonations(4);
  const { data: stats, isLoading: statsLoading } = useStatisticsSummary();

  // 카테고리별 아이콘과 색상 매핑
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, { icon: React.ReactNode, bgColor: string }> = {
      '아동복지': { icon: <Baby size={80} />, bgColor: 'from-pink-100 to-rose-100' },
      '동물보호': { icon: <Dog size={80} />, bgColor: 'from-cyan-100 to-teal-100' },
      '노인복지': { icon: <UserCircle size={80} />, bgColor: 'from-emerald-100 to-green-100' },
      '환경보호': { icon: <TreePine size={80} />, bgColor: 'from-red-100 to-orange-100' },
      '교육': { icon: <GraduationCap size={80} />, bgColor: 'from-purple-100 to-indigo-100' },
      '장애인복지': { icon: <Accessibility size={80} />, bgColor: 'from-rose-100 to-pink-100' }
    };
    return iconMap[category] || { icon: <Heart size={80} />, bgColor: 'from-gray-100 to-gray-200' };
  };

  return (
    <div>
      {/* Hero Section - 정적 콘텐츠 */}
      <section className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-6 md:py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 md:gap-8 lg:gap-12 items-center">
            {/* 정적 텍스트 및 버튼 - 즉시 렌더링 */}
            <div className="lg:col-span-2 text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                함께 만드는<br />따뜻한 세상
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-white/90">
                작은 나눔이 모여 큰 변화를 만듭니다
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/projects')}
                  className="w-full px-6 md:px-8 py-3 md:py-4 bg-white text-red-500 rounded-lg font-bold text-base md:text-lg hover:bg-gray-100 transition-all"
                >
                  프로젝트 둘러보기
                </button>
                {isLoggedIn && userType === 'organization' && (
                  <button
                    onClick={() => navigate('/projects/create')}
                    className="w-full px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-lg font-bold text-base md:text-lg hover:bg-white hover:text-red-500 transition-all"
                  >
                    프로젝트 등록하기
                  </button>
                )}
              </div>
            </div>

            {/* 동적 통계 섹션 - 스켈레톤 UI */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/30 relative overflow-hidden">
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <Shield className="text-white/40" size={60} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-green-300" size={16} />
                      <span className="text-xs md:text-sm text-white/80 font-semibold">검증된 프로젝트</span>
                    </div>
                    {statsLoading ? (
                      <div className="h-12 bg-white/30 rounded animate-pulse mb-1"></div>
                    ) : (
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1">
                        {stats?.totalProjects.toLocaleString() || '0'}
                      </div>
                    )}
                    <div className="text-sm md:text-base text-white/90">진행중인 프로젝트</div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/30 relative overflow-hidden">
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <Users className="text-white/40" size={60} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-blue-300" size={16} />
                      <span className="text-xs md:text-sm text-white/80 font-semibold">신뢰하는 기부자</span>
                    </div>
                    {statsLoading ? (
                      <div className="h-12 bg-white/30 rounded animate-pulse mb-1"></div>
                    ) : (
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1">
                        {stats?.totalDonors.toLocaleString() || '0'}
                      </div>
                    )}
                    <div className="text-sm md:text-base text-white/90">참여 기부자</div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/30 relative overflow-hidden">
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <Award className="text-white/40" size={70} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="text-yellow-300" size={16} />
                      <span className="text-xs md:text-sm text-white/80 font-semibold">투명하게 공개된 금액</span>
                    </div>
                    {statsLoading ? (
                      <div className="h-14 bg-white/30 rounded animate-pulse mb-1"></div>
                    ) : (
                      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-1">
                        {stats ? `${Math.floor(stats.totalDonationAmount / 100000000)}억원` : '0원'}
                      </div>
                    )}
                    <div className="text-sm md:text-base text-white/90">누적 기부금액 • 실시간 추적 가능</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Projects Section - 스켈레톤 UI */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* 정적 헤더 - 즉시 렌더링 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-10 gap-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">지금 주목받는 프로젝트</h2>
          <button
            onClick={() => navigate('/projects')}
            className="text-red-500 font-bold hover:underline text-sm md:text-base whitespace-nowrap"
          >
            전체보기 →
          </button>
        </div>

        {/* 동적 프로젝트 목록 - 스켈레톤 UI */}
        {projectsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="h-40 md:h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4 md:p-5">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {projects.slice(0, 4).map(project => {
              const progress = calculatePercentage(project.currentAmount, project.targetAmount);
              const categoryKo = getCategoryLabel(project.category); // 영어 -> 한글 변환
              const categoryInfo = getCategoryIcon(categoryKo);
              return (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className={`h-40 md:h-48 bg-gradient-to-br ${categoryInfo.bgColor} flex items-center justify-center text-gray-400`}>
                    {categoryInfo.icon}
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="text-xs md:text-sm text-red-500 font-semibold mb-2">{categoryKo}</div>
                    <h4 className="text-base md:text-lg font-bold mb-3 line-clamp-2">{project.title}</h4>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs md:text-sm mb-2">
                        <span className="font-bold text-red-500">{progress}%</span>
                        <span className="text-gray-500">D-{project.dday}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs md:text-sm">
                      <div>
                        <span className="font-bold text-gray-900">{formatAmount(project.currentAmount)}</span>
                        <span className="text-gray-500 ml-1">원</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users size={14} className="md:w-4 md:h-4" />
                        <span>{project.donors}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">프로젝트가 없습니다.</p>
          </div>
        )}
      </section>

      {/* Recent Donations Section - 스켈레톤 UI */}
      <section className="bg-gray-50 py-8 md:py-12 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          {/* 정적 헤더 - 즉시 렌더링 */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-10">실시간 기부 현황</h2>

          {/* 동적 기부 내역 - 스켈레톤 UI */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-200">
            {donationsLoading ? (
              <div className="space-y-3 md:space-y-4">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 md:p-5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0 space-y-2">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-24 ml-auto"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDonations && recentDonations.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {recentDonations.map((donation, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 md:p-5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="text-red-500" size={20} fill="currentColor" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm md:text-base">{donation.donorName}님이 기부했습니다</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">{donation.projectTitle}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                      <p className="font-bold text-lg md:text-xl text-red-500">{formatAmount(donation.amount)}원</p>
                      <p className="text-xs md:text-sm text-gray-500">{new Date(donation.timestamp).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">최근 기부 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
