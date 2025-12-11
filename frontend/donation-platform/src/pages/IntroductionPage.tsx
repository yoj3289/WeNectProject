import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Shield,
  Eye,
  Users,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Target,
  Wallet,
  FileText,
  CheckCircle,
  Sparkles,
  HandHeart,
  Building2,
  TrendingUp,
  ExternalLink,
  Calendar,
  Receipt,
  X
} from 'lucide-react';
import { useStatisticsSummary } from '../hooks/useStatistics';
import { useSettlementProjects } from '../hooks/useProjects';
import { formatAmount, calculatePercentage } from '../utils/formatters';
import { getCategoryLabel } from '../types';

const IntroductionPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<{
    date: string;
    category: string;
    amount: number;
    status: string;
    description: string;
  } | null>(null);

  // 목업 지출 데이터
  const mockExpenses = [
    { date: '2025.12.01', category: '식비', amount: 850000, status: 'APPROVED', description: '결식아동 급식 지원 - 12월 첫째주 도시락 150개 제공\n\n- 조식: 50개 x 3,000원\n- 중식: 50개 x 4,500원\n- 석식: 50개 x 4,000원' },
    { date: '2025.11.28', category: '교육비', amount: 1200000, status: 'APPROVED', description: '방과후 학습 교재 구입비\n\n- 초등 국어/수학 교재: 30권 x 15,000원\n- 중등 영어/수학 교재: 25권 x 18,000원\n- 학습 노트 및 필기구: 150,000원' },
    { date: '2025.11.25', category: '의료비', amount: 400000, status: 'PENDING', description: '어르신 건강검진 지원\n\n- 기본 건강검진: 10명 x 30,000원\n- 안과 검진: 5명 x 20,000원' },
  ];

  // API 데이터 연동
  const { data: statistics, isLoading: statsLoading } = useStatisticsSummary();
  const { data: settlementProjects, isLoading: projectsLoading } = useSettlementProjects({ size: 3 });

  const coreValues = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: '마음이 닿는 기부',
      description: '기부자와 수혜자를 직접 연결합니다. 여러분의 따뜻한 마음이 필요한 곳에 정확히 전달됩니다.',
      gradient: 'from-amber-500 to-orange-500',
      link: '/projects'
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: '100% 투명한 기부',
      description: '모든 기부금의 사용 내역을 실시간으로 확인할 수 있습니다. 저금통 시스템을 통해 기부금이 어디에 쓰이는지 투명하게 공개합니다.',
      gradient: 'from-blue-500 to-cyan-500',
      link: '/projects?status=settlement'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: '검증된 단체만',
      description: '엄격한 심사를 통과한 비영리 단체만 프로젝트를 등록할 수 있습니다. 신뢰할 수 있는 기부 환경을 제공합니다.',
      gradient: 'from-green-500 to-emerald-500',
      link: '/organizations'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: <Target className="w-6 h-6" />,
      title: '프로젝트 탐색',
      description: '다양한 카테고리의 기부 프로젝트 중 관심 있는 프로젝트를 찾아보세요.'
    },
    {
      step: 2,
      icon: <HandHeart className="w-6 h-6" />,
      title: '기부하기',
      description: '원하는 금액을 선택하고 간편하게 기부를 진행하세요. 카카오페이, 토스페이 등 다양한 결제 수단을 지원합니다.'
    },
    {
      step: 3,
      icon: <Wallet className="w-6 h-6" />,
      title: '저금통 확인',
      description: '기부금은 단체의 저금통에 안전하게 보관됩니다. 사용 내역을 실시간으로 확인할 수 있습니다.'
    },
    {
      step: 4,
      icon: <FileText className="w-6 h-6" />,
      title: '결과 보고',
      description: '프로젝트 완료 후 상세한 결과 보고서와 기부금 사용 내역을 받아보세요.'
    }
  ];

  // 누적 기부금 포맷팅
  const formatDonationAmount = (amount: number | undefined) => {
    if (!amount || amount === 0) return '0원';
    if (amount >= 100000000) {
      return `${Math.floor(amount / 100000000)}억+`;
    }
    if (amount >= 10000000) {
      return `${Math.floor(amount / 10000000)}천만+`;
    }
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만+`;
    }
    return formatAmount(amount) + '원';
  };

  const faqs = [
    {
      question: '위넥트는 어떤 플랫폼인가요?',
      answer: '위넥트(WeNect)는 "We + Connect"의 합성어로, 기부자와 비영리 단체를 연결하는 투명한 기부 플랫폼입니다. 모든 기부금의 사용 내역을 실시간으로 확인할 수 있어 신뢰할 수 있는 기부 환경을 제공합니다.'
    },
    {
      question: '기부금은 어떻게 사용되나요?',
      answer: '기부금은 각 단체의 "저금통"에 안전하게 보관되며, 단체가 지출할 때마다 사용 내역(영수증, 용도 등)이 투명하게 공개됩니다. 기부자는 언제든지 자신의 기부금이 어떻게 사용되고 있는지 확인할 수 있습니다.'
    },
    {
      question: '어떤 단체들이 프로젝트를 등록하나요?',
      answer: '엄격한 심사를 통과한 비영리 단체만 프로젝트를 등록할 수 있습니다. 단체 등록 시 사업자등록증, 비영리법인 증빙 서류 등을 검토하며, 관리자 승인 후에만 프로젝트를 게시할 수 있습니다.'
    },
    {
      question: '기부금 영수증은 어떻게 발급받나요?',
      answer: '마이페이지의 기부 내역에서 각 기부 건별로 기부금 영수증을 PDF로 다운로드할 수 있습니다. 연말정산 시 필요한 기부금 영수증도 한 번에 발급받을 수 있습니다.'
    },
    {
      question: '정기 기부도 가능한가요?',
      answer: '현재는 일회성 기부만 지원하고 있습니다. 정기 기부 기능은 추후 업데이트 예정입니다. 관심 있는 프로젝트는 "관심 프로젝트"에 추가하여 쉽게 다시 기부할 수 있습니다.'
    },
    {
      question: '플랫폼 수수료가 있나요?',
      answer: '위넥트는 기부금에 대한 별도의 플랫폼 수수료를 부과하지 않습니다. 기부금 전액이 실제 수혜자에게 전달됩니다.'
    }
  ];

  // 스켈레톤 UI 컴포넌트
  const StatSkeleton = () => (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-stone-100 text-center animate-pulse">
      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-stone-200 rounded-xl mb-3" />
      <div className="h-7 sm:h-9 bg-stone-200 rounded w-20 mx-auto mb-2" />
      <div className="h-4 bg-stone-100 rounded w-16 mx-auto" />
    </div>
  );

  const ProjectCardSkeleton = () => (
    <div className="bg-white rounded-xl p-4 border border-stone-200 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-stone-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-3 bg-stone-200 rounded w-16 mb-2" />
          <div className="h-4 bg-stone-200 rounded w-full" />
        </div>
      </div>
      <div className="h-2 bg-stone-100 rounded-full mb-2" />
      <div className="flex justify-between">
        <div className="h-4 bg-stone-200 rounded w-12" />
        <div className="h-4 bg-stone-200 rounded w-20" />
      </div>
    </div>
  );

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-stone-900 text-white overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">투명한 기부의 시작</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-white font-light leading-tight mb-6">
              마음을 잇는<br />
              <span className="text-amber-400 font-medium">가장 투명한 기부</span>
            </h1>

            <p className="text-stone-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              위넥트는 기부자와 비영리 단체를 직접 연결합니다.<br className="hidden sm:block" />
              모든 기부금의 사용처를 실시간으로 확인할 수 있는<br className="hidden sm:block" />
              투명한 기부 플랫폼입니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/projects"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-amber-500/30"
              >
                프로젝트 둘러보기
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 50L48 45.7C96 41.3 192 32.7 288 29.2C384 25.7 480 27.3 576 35.8C672 44.3 768 59.7 864 62.5C960 65.3 1056 55.7 1152 50.8C1248 46 1344 46 1392 46L1440 46V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="#fafaf9"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 px-4 -mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsLoading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-stone-100 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 text-amber-600 rounded-xl mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-800 mb-1">
                    {statistics?.totalDonors?.toLocaleString() || 0}+
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500">누적 기부자</p>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-stone-100 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 text-amber-600 rounded-xl mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-800 mb-1">
                    {statistics?.totalProjects?.toLocaleString() || 0}+
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500">등록된 프로젝트</p>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-stone-100 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 text-amber-600 rounded-xl mb-3">
                    <Eye className="w-5 h-5" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-800 mb-1">100%</p>
                  <p className="text-xs sm:text-sm text-stone-500">투명 공개</p>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-stone-100 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 text-amber-600 rounded-xl mb-3">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-800 mb-1">
                    {formatDonationAmount(statistics?.totalDonationAmount)}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500">누적 기부금</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-amber-600 uppercase tracking-[0.2em] text-xs mb-3">Our Values</p>
            <h2 className="text-xl md:text-2xl text-stone-800 font-light">
              위넥트가 <span className="font-medium">추구하는 가치</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              투명하고 신뢰할 수 있는 기부 문화를 만들어갑니다
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {coreValues.map((value, index) => (
              <Link
                key={index}
                to={value.link}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-stone-100 hover:shadow-xl transition-all group cursor-pointer block"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${value.gradient} text-white rounded-2xl mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  {value.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-stone-800 mb-3">{value.title}</h3>
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">{value.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-amber-600 uppercase tracking-[0.2em] text-xs mb-3">How It Works</p>
            <h2 className="text-xl md:text-2xl text-stone-800 font-light">
              이렇게 <span className="font-medium">기부해요</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              간단한 4단계로 투명한 기부에 참여하세요
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 h-full hover:border-amber-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-stone-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-stone-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Section - 실제 프로젝트 연동 */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-amber-600 uppercase tracking-[0.2em] text-xs mb-3">Transparency</p>
              <h2 className="text-xl md:text-2xl text-stone-800 font-light mb-6">
                저금통 시스템으로<br />
                <span className="font-medium">투명한 기부금 관리</span>
              </h2>
              <div className="space-y-4">
                {[
                  '모든 지출 내역 실시간 공개',
                  '영수증 첨부 필수화',
                  '카테고리별 사용 내역 분류',
                  '프로젝트 종료 시 상세 결과 보고서'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-stone-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
                {/* 다크 헤더 - SettlementSummaryTab 스타일 */}
                <div className="bg-stone-800 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">지출 내역 상세</h4>
                      <p className="text-xs text-stone-400">모든 지출은 이렇게 투명하게 공개됩니다</p>
                    </div>
                  </div>
                </div>

                {/* 목업 지출 내역 */}
                <div className="p-5">
                  {/* 총 지출 요약 */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 mb-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-amber-600" />
                      <span className="text-xs text-stone-600">총 지출 금액</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">2,450,000원</p>
                    <p className="text-xs text-stone-500">12건의 승인된 지출</p>
                  </div>

                  {/* 목업 지출 리스트 */}
                  <div className="space-y-2">
                    {mockExpenses.map((expense, idx) => (
                      <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors">
                        {/* 모바일: 세로 레이아웃 / 데스크톱: 가로 레이아웃 */}
                        {/* 모바일 (sm 미만) */}
                        <div className="flex flex-col gap-2 sm:hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-stone-500">
                                <Calendar size={12} />
                                <span className="text-xs">{expense.date}</span>
                              </div>
                              <span className="px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded text-xs font-medium">
                                {expense.category}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              expense.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {expense.status === 'APPROVED' ? '승인' : '대기'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-600 text-sm">
                              {formatAmount(expense.amount)}원
                            </span>
                            <button
                              onClick={() => setSelectedExpense(expense)}
                              className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
                            >
                              <Eye size={12} />
                              상세
                            </button>
                          </div>
                        </div>
                        {/* 데스크톱 (sm 이상) */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-stone-500">
                              <Calendar size={14} />
                              <span className="text-xs">{expense.date}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-xs font-medium">
                              {expense.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-600 text-sm">
                              {formatAmount(expense.amount)}원
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              expense.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {expense.status === 'APPROVED' ? '승인됨' : '대기중'}
                            </span>
                            <button
                              onClick={() => setSelectedExpense(expense)}
                              className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
                            >
                              <Eye size={12} />
                              상세
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-200 rounded-full opacity-50 blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-200 rounded-full opacity-50 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-amber-600 uppercase tracking-[0.2em] text-xs mb-3">FAQ</p>
            <h2 className="text-xl md:text-2xl text-stone-800 font-light">
              자주 <span className="font-medium">묻는 질문</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-stone-100 transition-colors"
                >
                  <span className="text-lg sm:text-xl text-stone-800 font-bold pr-4">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 flex-shrink-0" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-5 pb-5">
                    <p className="text-sm sm:text-base text-stone-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-10 px-4 bg-gradient-to-br from-stone-900 to-stone-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-lg md:text-xl font-light mb-3">
            지금 바로 <span className="font-medium">참여하세요</span>
          </h2>
          <p className="text-stone-400 text-sm mb-5">
            작은 기부가 모여 큰 변화를 만듭니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition-all hover:scale-105 text-sm"
            >
              기부하러 가기
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/community"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all text-sm"
            >
              커뮤니티 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* 지출 상세 모달 */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="bg-stone-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Receipt className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">지출 상세 정보</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{selectedExpense.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="p-2 hover:bg-stone-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-5">
              {/* 지출 금액 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-stone-600 mb-1">지출 금액</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatAmount(selectedExpense.amount)}원
                </p>
              </div>

              {/* 카테고리 & 상태 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">카테고리</p>
                  <p className="text-sm font-medium text-stone-800">{selectedExpense.category}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">상태</p>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                    selectedExpense.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedExpense.status === 'APPROVED' ? '승인됨' : '대기중'}
                  </span>
                </div>
              </div>

              {/* 지출 내역 설명 */}
              <div>
                <p className="text-sm font-medium text-stone-700 mb-2">지출 내역 설명</p>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {selectedExpense.description}
                  </p>
                </div>
              </div>

              {/* 영수증 (목업) */}
              <div>
                <p className="text-sm font-medium text-stone-700 mb-2">영수증</p>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">영수증_{selectedExpense.date.replace(/\./g, '')}.pdf</p>
                    <p className="text-xs text-stone-500">PDF 문서</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200">
              <button
                onClick={() => setSelectedExpense(null)}
                className="w-full px-4 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroductionPage;
