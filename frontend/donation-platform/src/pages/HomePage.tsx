import React from 'react';
import { Shield, Users, CheckCircle, Eye, Award, Heart, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility } from 'lucide-react';
import type { Project, RecentDonation, PageType, UserType, TabType } from '../types';

interface HomePageProps {
  projects: Project[];
  recentDonations: RecentDonation[];
  isLoggedIn: boolean;
  userType: UserType;
  setCurrentPage: (page: PageType) => void;
  setSelectedProject: (project: Project) => void;
  setActiveTab: (tab: TabType) => void;
  formatAmount: (amount: number) => string;
  calculatePercentage: (current: number, target: number) => number;
}

const HomePage: React.FC<HomePageProps> = ({
  projects,
  recentDonations,
  isLoggedIn,
  userType,
  setCurrentPage,
  setSelectedProject,
  setActiveTab,
  formatAmount,
  calculatePercentage
}) => {
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
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="max-w-[1400px] mx-auto px-8 py-24">
          <div className="grid grid-cols-7 gap-12 items-center">
            <div className="col-span-2">
              <h1 className="text-6xl font-bold mb-6 leading-tight">
                함께 만드는<br />따뜻한 세상
              </h1>
              <p className="text-xl mb-8 text-white/90">
                작은 나눔이 모여 큰 변화를 만듭니다
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setCurrentPage('projects')}
                  className="w-full px-8 py-4 bg-white text-red-500 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all"
                >
                  프로젝트 둘러보기
                </button>
                {isLoggedIn && userType === 'organization' && (
                  <button
                    onClick={() => setCurrentPage('create-project')}
                    className="w-full px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-red-500 transition-all"
                  >
                    프로젝트 등록하기
                  </button>
                )}
              </div>
            </div>

            {/* Statistics Section */}
            <div className="col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Shield className="text-white/40" size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-green-300" size={20} />
                      <span className="text-sm text-white/80 font-semibold">검증된 프로젝트</span>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">1,234</div>
                    <div className="text-base text-white/90">진행중인 프로젝트</div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Users className="text-white/40" size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-blue-300" size={20} />
                      <span className="text-sm text-white/80 font-semibold">신뢰하는 기부자</span>
                    </div>
                    <div className="text-5xl font-bold text-white mb-1">45,678</div>
                    <div className="text-base text-white/90">참여 기부자</div>
                  </div>
                </div>

                <div className="col-span-2 bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Award className="text-white/40" size={100} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="text-yellow-300" size={20} />
                      <span className="text-sm text-white/80 font-semibold">투명하게 공개된 금액</span>
                    </div>
                    <div className="text-6xl font-bold text-white mb-1">23억원</div>
                    <div className="text-base text-white/90">누적 기부금액 • 실시간 추적 가능</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Projects Section */}
      <section className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-bold">지금 주목받는 프로젝트</h2>
          <button
            onClick={() => setCurrentPage('projects')}
            className="text-red-500 font-bold hover:underline"
          >
            전체보기 →
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {projects.slice(0, 4).map(project => {
            const progress = calculatePercentage(project.currentAmount, project.targetAmount);
            const categoryInfo = getCategoryIcon(project.category);
            return (
              <div
                key={project.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedProject(project);
                  setActiveTab('intro');
                  setCurrentPage('detail');
                }}
              >
                <div className={`h-48 bg-gradient-to-br ${categoryInfo.bgColor} flex items-center justify-center text-gray-400`}>
                  {categoryInfo.icon}
                </div>
                <div className="p-5">
                  <div className="text-sm text-red-500 font-semibold mb-2">{project.category}</div>
                  <h4 className="text-lg font-bold mb-3 line-clamp-2">{project.title}</h4>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
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

                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-bold text-gray-900">{formatAmount(project.currentAmount)}</span>
                      <span className="text-gray-500 ml-1">원</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users size={16} />
                      <span>{project.donors}명</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Donations Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-4xl font-bold mb-10">실시간 기부 현황</h2>
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="space-y-4">
              {recentDonations.map((donation, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Heart className="text-red-500" size={24} fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-bold">{donation.name}님이 기부했습니다</p>
                      <p className="text-sm text-gray-600">{donation.project}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-red-500">{formatAmount(donation.amount)}원</p>
                    <p className="text-sm text-gray-500">{donation.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
