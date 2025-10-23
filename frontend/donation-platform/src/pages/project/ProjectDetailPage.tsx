import React, { useState } from 'react';
import { Heart, Users, Share2, Baby, Dog, UserCircle, TreePine, GraduationCap, Accessibility, Eye, EyeOff } from 'lucide-react';
import type { Project, TabType } from '../../types';

interface ProjectDetailPageProps {
  project: Project;
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onToggleFavorite: (projectId: number) => void;
  onNavigateToLogin: () => void;
  onShowDonationModal: () => void;
  onBack: () => void;
}

// 기부자 타입 정의
interface Donor {
  id: number;
  name: string;
  amount: number;
  date: string;
  isAnonymous: boolean;
  message?: string;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  isLoggedIn,
  favoriteProjectIds,
  onToggleFavorite,
  onNavigateToLogin,
  onShowDonationModal,
  onBack
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [showAnonymousDonors, setShowAnonymousDonors] = useState(true);

  // 샘플 기부자 데이터
  const donors: Donor[] = [
    { id: 1, name: '김민수', amount: 50000, date: '2024-03-15 14:30', isAnonymous: false, message: '좋은 일에 쓰이길 바랍니다!' },
    { id: 2, name: '익명', amount: 100000, date: '2024-03-15 12:20', isAnonymous: true, message: '응원합니다' },
    { id: 3, name: '이지은', amount: 30000, date: '2024-03-15 10:15', isAnonymous: false },
    { id: 4, name: '박서준', amount: 200000, date: '2024-03-14 18:45', isAnonymous: false, message: '아이들의 미래를 위해 작은 힘을 보탭니다. 파이팅!' },
    { id: 5, name: '익명', amount: 50000, date: '2024-03-14 16:30', isAnonymous: true },
    { id: 6, name: '최유진', amount: 20000, date: '2024-03-14 14:20', isAnonymous: false, message: '좋은 프로젝트네요!' },
    { id: 7, name: '익명', amount: 150000, date: '2024-03-14 11:10', isAnonymous: true, message: '힘내세요!' },
    { id: 8, name: '정해인', amount: 30000, date: '2024-03-13 20:30', isAnonymous: false },
  ];

  // 응원 메시지가 있는 기부자만 필터링
  const donorsWithMessages = donors.filter(d => d.message);

  // Helper Functions
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR');
  };

  const calculatePercentage = (current: number, target: number): number => {
    return Math.round((current / target) * 100);
  };

  const progress = calculatePercentage(project.currentAmount, project.targetAmount);
  const isFavorite = favoriteProjectIds.has(project.id);

  // 카테고리별 아이콘과 색상 매핑
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, { icon: React.ReactNode, bgColor: string }> = {
      '아동복지': { icon: <Baby size={120} />, bgColor: 'from-pink-100 to-rose-100' },
      '동물보호': { icon: <Dog size={120} />, bgColor: 'from-cyan-100 to-teal-100' },
      '노인복지': { icon: <UserCircle size={120} />, bgColor: 'from-emerald-100 to-green-100' },
      '환경보호': { icon: <TreePine size={120} />, bgColor: 'from-red-100 to-orange-100' },
      '교육': { icon: <GraduationCap size={120} />, bgColor: 'from-purple-100 to-indigo-100' },
      '장애인복지': { icon: <Accessibility size={120} />, bgColor: 'from-rose-100 to-pink-100' }
    };
    return iconMap[category] || { icon: <Heart size={120} />, bgColor: 'from-gray-100 to-gray-200' };
  };

  const categoryInfo = getCategoryIcon(project.category);

  // SNS 공유 함수
  const shareToSNS = (platform: string, projectTitle: string) => {
    const url = window.location.href;
    const text = `${projectTitle} - 따뜻한 나눔`;

    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      default:
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('링크가 복사되었습니다!');
    });
  };

  // Handlers
  const handleFavoriteClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      onNavigateToLogin();
    } else {
      onToggleFavorite(project.id);
    }
  };

  const handleDonateClick = () => {
    if (!isLoggedIn) {
      onNavigateToLogin();
    } else {
      onShowDonationModal();
    }
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'intro':
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {project.description}
            </p>
            <h3 className="text-2xl font-bold mb-4">프로젝트 상세 내용</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              이 프로젝트는 우리 사회의 소외된 이웃들에게 실질적인 도움을 제공하기 위해 기획되었습니다.
              여러분의 소중한 기부금은 투명하게 관리되며, 정산 과정을 통해
              필요한 곳에 정확히 전달됩니다.
            </p>
            <h3 className="text-2xl font-bold mb-4">기대 효과</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>지역사회의 복지 향상</li>
              <li>취약계층에 대한 실질적 지원</li>
              <li>투명한 기부 문화 정착</li>
              <li>지속가능한 나눔 생태계 구축</li>
            </ul>
          </div>
        );
      case 'progress':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-lg mb-4">모금 진행 현황</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">현재 모금액</p>
                  <p className="text-xl font-bold">{formatAmount(project.currentAmount)}원</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">목표 금액</p>
                  <p className="text-xl font-bold">{formatAmount(project.targetAmount)}원</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">달성률</p>
                  <p className="text-xl font-bold text-red-500">{progress}%</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">남은 기간</p>
                  <p className="text-xl font-bold">D-{project.dday}</p>
                </div>
              </div>
            </div>

            {/* 진행 타임라인 */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              <h4 className="font-bold text-lg mb-4">진행 타임라인</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                  <div>
                    <p className="font-bold text-gray-800">프로젝트 시작</p>
                    <p className="text-sm text-gray-600">2024-02-01</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                  <div>
                    <p className="font-bold text-gray-800">50% 달성</p>
                    <p className="text-sm text-gray-600">2024-02-20</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mt-1"></div>
                  <div>
                    <p className="font-bold text-gray-400">목표 달성 예상</p>
                    <p className="text-sm text-gray-400">2024-03-30</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'donors':
        return (
          <div className="space-y-6">
            {/* 기부자 통계 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">총 기부자 수</p>
                <p className="text-3xl font-bold text-red-600">{donors.length}명</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">평균 기부액</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatAmount(Math.round(donors.reduce((sum, d) => sum + d.amount, 0) / donors.length))}원
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">최고 기부액</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatAmount(Math.max(...donors.map(d => d.amount)))}원
                </p>
              </div>
            </div>

            {/* 익명 표시 토글 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-700">익명 기부자 표시</span>
              <button
                onClick={() => setShowAnonymousDonors(!showAnonymousDonors)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showAnonymousDonors
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {showAnonymousDonors ? <Eye size={18} /> : <EyeOff size={18} />}
                {showAnonymousDonors ? '표시' : '숨김'}
              </button>
            </div>

            {/* 기부자 목록 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="font-bold text-lg">기부자 목록</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {donors
                  .filter(donor => showAnonymousDonors || !donor.isAnonymous)
                  .map((donor) => (
                    <div key={donor.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-red-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              {donor.isAnonymous ? '익명' : donor.name}
                            </p>
                            <p className="text-sm text-gray-500">{donor.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-red-600">
                            {formatAmount(donor.amount)}원
                          </p>
                        </div>
                      </div>
                      {donor.message && (
                        <div className="mt-3 ml-13 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">"{donor.message}"</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-l-4 border-red-500">
              <p className="text-sm text-gray-600 mb-1">총 응원 메시지</p>
              <p className="text-2xl font-bold text-red-600">{donorsWithMessages.length}개</p>
            </div>

            {donorsWithMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Heart className="mx-auto mb-4 text-gray-300" size={64} />
                <p className="text-lg font-semibold">아직 응원 메시지가 없습니다</p>
                <p className="text-sm mt-2">첫 응원 메시지를 남겨주세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donorsWithMessages.map((donor) => (
                  <div key={donor.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart size={24} className="text-red-600" fill="currentColor" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-800">
                              {donor.isAnonymous ? '익명' : donor.name}
                            </p>
                            <p className="text-sm text-gray-500">{donor.date}</p>
                          </div>
                          <p className="font-bold text-red-600">
                            {formatAmount(donor.amount)}원
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 leading-relaxed">"{donor.message}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <button
          onClick={onBack}
          className="mb-6 text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← 목록으로
        </button>

        <div className="grid grid-cols-3 gap-8">
          {/* 메인 컨텐츠 */}
          <div className="col-span-2 space-y-6">
            {/* 프로젝트 이미지 */}
            <div className={`bg-gradient-to-br ${categoryInfo.bgColor} rounded-2xl p-16 flex items-center justify-center`}>
              <div className="text-gray-400">
                {categoryInfo.icon}
              </div>
            </div>

            {/* 프로젝트 상세 카드 (제목 + 탭) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* 프로젝트 헤더 */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                    {project.category}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                    D-{project.dday}
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{project.title}</h1>
                <p className="text-xl text-gray-600">{project.organization}</p>
              </div>

              {/* 탭 네비게이션 */}
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'intro', label: '프로젝트 소개' },
                  { id: 'progress', label: '진행현황' },
                  { id: 'donors', label: '기부자 목록' },
                  { id: 'messages', label: '응원 메시지' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 py-4 font-semibold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-8">
                {renderTabContent()}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
              {/* 진행률 표시 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-4xl font-bold text-red-500">{progress}%</span>
                  <span className="px-3 py-1 bg-red-50 text-red-500 font-bold rounded-full">
                    D-{project.dday}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* 모금 정보 */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">현재 모금액</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(project.currentAmount)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">목표 금액</p>
                  <p className="text-lg font-semibold text-gray-600">
                    {formatAmount(project.targetAmount)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">참여 인원</p>
                  <p className="text-lg font-semibold flex items-center gap-1">
                    <Users size={18} />
                    {project.donors}명
                  </p>
                </div>
              </div>

              {/* 관심 프로젝트 버튼 */}
              <button
                onClick={handleFavoriteClick}
                className={`w-full py-3 rounded-lg font-bold text-lg transition-all mb-3 flex items-center justify-center gap-2 ${
                  isFavorite
                    ? 'bg-red-50 text-red-500 border-2 border-red-500 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Heart
                  size={20}
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
                {isFavorite ? '관심 프로젝트 등록됨' : '관심 프로젝트 등록'}
              </button>

              {/* 기부하기 버튼 */}
              <button
                onClick={handleDonateClick}
                className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all mb-3"
              >
                기부하기
              </button>

              {/* SNS 공유 버튼들 */}
              <div className="flex gap-2">
                <button
                  onClick={() => shareToSNS('facebook', project.title)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Facebook
                </button>
                <button
                  onClick={() => shareToSNS('twitter', project.title)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Twitter
                </button>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  링크 복사
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
