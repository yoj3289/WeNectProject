import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronDown, Quote, ArrowRight, Users, Target, HandHeart, ChevronLeft, ChevronRight, TrendingUp, Award } from 'lucide-react';
import type { UserType } from '../types';
import { getCategoryLabel } from '../types';
import { usePopularProjects, useTopFundedProjects } from '../hooks/useProjects';
import { useRecentDonations, useFeaturedMessages } from '../hooks/useDonations';
import { useStatisticsSummary } from '../hooks/useStatistics';
import { formatAmount, calculatePercentage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface HomePageProps {
  isLoggedIn: boolean;
  userType: UserType;
}


const HomePage: React.FC<HomePageProps> = ({
  isLoggedIn,
  userType,
}) => {
  // API 호출
  const { data: popularProjects, isLoading: popularLoading } = usePopularProjects(8);
  const { data: topFundedProjects, isLoading: topFundedLoading } = useTopFundedProjects(8);
  const { data: recentDonations } = useRecentDonations(10);
  const { data: stats, isLoading: statsLoading } = useStatisticsSummary();
  const { data: featuredMessages } = useFeaturedMessages(10);

  const [currentSlide, setCurrentSlide] = useState(0);
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  // 캐러셀 스크롤 위치 추적 (끝 도달 시 화살표 숨김용)
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 스크롤 위치 확인 함수
  const checkScrollPosition = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const ref = trendingScrollRef.current;
    if (ref) {
      const handleScroll = () => checkScrollPosition(trendingScrollRef);
      ref.addEventListener('scroll', handleScroll);
      // 초기 상태 체크
      checkScrollPosition(trendingScrollRef);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [checkScrollPosition, popularProjects]);

  // 히어로 섹션 풀스크린 상태
  const [isHeroExpanded, setIsHeroExpanded] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  // 페이지 진입 시 항상 히어로 펼친 상태로 초기화
  useEffect(() => {
    setIsHeroExpanded(true);
    window.scrollTo(0, 0);
  }, []);

  // 스크롤/클릭 시 히어로 접기 (스크롤 이동 없이 축소만)
  const collapseHero = useCallback(() => {
    if (isHeroExpanded) {
      setIsHeroExpanded(false);
    }
  }, [isHeroExpanded]);

  // SCROLL 버튼 클릭 핸들러
  const handleScrollClick = () => {
    collapseHero();
  };

  // 휠 이벤트로 히어로 접기
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isHeroExpanded && e.deltaY > 0) {
        e.preventDefault();
        collapseHero();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isHeroExpanded, collapseHero]);

  // 터치 스와이프로 히어로 접기 (모바일)
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isHeroExpanded) {
        const touchEndY = e.touches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        if (deltaY > 50) { // 50px 이상 위로 스와이프
          collapseHero();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isHeroExpanded, collapseHero]);

  // 실제 API 응답을 stories 형식으로 변환
  const stories = featuredMessages && featuredMessages.length > 0
    ? featuredMessages.map(msg => ({
        quote: msg.message,
        name: msg.donorName,
        role: msg.projectTitle,
        year: new Date(msg.donatedAt).getFullYear().toString()
      }))
    : [];

  // 가로 스크롤 함수
  const scroll = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollTo({
        left: direction === 'left'
          ? ref.current.scrollLeft - scrollAmount
          : ref.current.scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 후기 자동 슬라이드 (stories가 있을 때만 실행)
  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % stories.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [stories.length]);

  // 누적 기부금 포맷팅
  const formatDonationAmount = (amount: number | undefined) => {
    if (!amount || amount === 0) return '0원';
    if (amount >= 100000000) {
      return `${Math.floor(amount / 100000000)}억+`;
    }
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만+`;
    }
    return formatAmount(amount) + '원';
  };

  return (
    <div className="bg-stone-50">

      {/* 히어로 섹션 - 풀스크린 인터랙티브 */}
      <section
        ref={heroRef}
        onClick={collapseHero}
        className={`relative bg-stone-900 overflow-hidden transition-all duration-700 ease-out cursor-pointer ${
          isHeroExpanded
            ? 'h-screen min-h-[600px]'
            : 'min-h-[500px] md:min-h-[600px]'
        }`}
      >
        {/* 돼지 저금통 배경 이미지 */}
        <div
          className="absolute inset-0 bg-no-repeat bg-contain opacity-[0.15]"
          style={{
            backgroundImage: `url('/icon_piggy2.png')`,
            backgroundPosition: '65% center'
          }}
        />
        {/* 도트 패턴 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-stone-900/0 to-stone-900" />

        <div className={`relative h-full flex flex-col items-center justify-center text-center px-4 py-16 transition-all duration-700 ${
          isHeroExpanded ? 'min-h-screen' : 'min-h-[500px] md:min-h-[600px]'
        }`}>
          <p className={`text-amber-400 uppercase tracking-[0.3em] text-xs md:text-sm mb-6 transition-all duration-500 ${
            isHeroExpanded ? 'opacity-100 translate-y-0' : 'opacity-100'
          }`}>
            Together We Can Make a Difference
          </p>

          <h1 className={`text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-white font-light leading-tight mb-6 max-w-3xl transition-all duration-500 ${
            isHeroExpanded ? 'opacity-100 translate-y-0' : 'opacity-100'
          }`}>
            당신의 <span className="text-amber-400 font-medium">작은 나눔</span>이<br />
            누군가의 <span className="text-amber-400 font-medium">전부</span>가 됩니다
          </h1>

          <p className="text-stone-300 text-base md:text-lg mb-8 max-w-xl">
            {stats?.totalDonors?.toLocaleString() || 0}명의 기부자와 함께 {stats?.totalDonationAmount ? formatAmount(stats.totalDonationAmount) : '0'}원의 사랑을 전달했습니다.
          </p>

          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {isLoggedIn && userType === 'organization' ? (
              <Link
                to="/projects/create"
                className="bg-amber-500 text-stone-900 px-8 py-4 text-base font-medium hover:bg-amber-400 transition-colors"
              >
                프로젝트 등록하기
              </Link>
            ) : (
              <Link
                to="/projects"
                className="bg-amber-500 text-stone-900 px-8 py-4 text-base font-medium hover:bg-amber-400 transition-colors"
              >
                함께하기
              </Link>
            )}
            <Link
              to="/community"
              className="text-white border-b-2 border-white/30 hover:border-white pb-1 transition-all text-sm"
            >
              소통하기
            </Link>
          </div>
        </div>

        {/* 스크롤 다운 인디케이터 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleScrollClick();
          }}
          className={`absolute bottom-16 md:bottom-20 left-0 right-0 flex justify-center transition-opacity duration-500 ${
            isHeroExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-white/50 flex flex-col items-center gap-2 animate-bounce hover:text-white/80 transition-colors">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown size={20} />
          </div>
        </button>
      </section>

      {/* 실시간 기부 마퀴 - 히어로 바로 아래 */}
      {recentDonations && recentDonations.length > 0 && (
        <section className="py-3 bg-stone-800 text-white overflow-hidden">
          <div className="relative">
            <div className="flex items-center">
              {/* 왼쪽 라벨 */}
              <div className="flex items-center gap-2 shrink-0 bg-stone-800 z-10 pr-4 pl-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-stone-300 text-sm font-medium">실시간 기부</span>
              </div>

              {/* 마퀴 애니메이션 */}
              <div className="overflow-hidden flex-1">
                <div className="animate-marquee flex gap-8 whitespace-nowrap">
                  {/* 원본 */}
                  {recentDonations.map((donation, idx) => (
                    <span key={`a-${idx}`} className="text-stone-400 text-sm">
                      <span className="text-white font-medium">{donation.donorName}</span>님이{' '}
                      <span className="text-amber-400 font-medium">{formatAmount(donation.amount)}원</span>을 기부했습니다
                    </span>
                  ))}
                  {/* 복제 (무한 루프용) */}
                  {recentDonations.map((donation, idx) => (
                    <span key={`b-${idx}`} className="text-stone-400 text-sm">
                      <span className="text-white font-medium">{donation.donorName}</span>님이{' '}
                      <span className="text-amber-400 font-medium">{formatAmount(donation.amount)}원</span>을 기부했습니다
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Our Impact 섹션 */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 uppercase tracking-[0.2em] text-xs mb-3">Our Impact</p>
            <h2 className="text-2xl md:text-3xl text-stone-800 font-light">
              당신의 나눔이 만든 <span className="font-medium">변화</span>
            </h2>
          </div>

          {/* 임팩트 숫자 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <HandHeart className="text-amber-600" size={22} />
              </div>
              <p className="text-2xl md:text-3xl font-light text-stone-800 mb-1">
                {statsLoading ? '-' : formatDonationAmount(stats?.totalDonationAmount)}
              </p>
              <p className="text-stone-500 text-sm">누적 기부금</p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Users className="text-amber-600" size={22} />
              </div>
              <p className="text-2xl md:text-3xl font-light text-stone-800 mb-1">
                {statsLoading ? '-' : (stats?.totalDonors?.toLocaleString() || 0)}
              </p>
              <p className="text-stone-500 text-sm">참여 기부자</p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Target className="text-amber-600" size={22} />
              </div>
              <p className="text-2xl md:text-3xl font-light text-stone-800 mb-1">
                {statsLoading ? '-' : (stats?.totalProjects || 0)}
              </p>
              <p className="text-stone-500 text-sm">완료 프로젝트</p>
            </div>

            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Heart className="text-amber-600" size={22} />
              </div>
              <p className="text-2xl md:text-3xl font-light text-stone-800 mb-1">100%</p>
              <p className="text-stone-500 text-sm">투명한 전달</p>
            </div>
          </div>

          {/* 인용문 슬라이드 - Featured 메시지가 있을 때만 표시 */}
          {stories.length > 0 && (
            <div className="relative max-w-2xl mx-auto group">
              {/* 왼쪽 화살표 - hover 시에만 표시, 무한 루프 */}
              <button
                onClick={() => setCurrentSlide(prev => prev === 0 ? stories.length - 1 : prev - 1)}
                className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white border border-stone-200 rounded-full shadow-md hover:shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={20} className="text-stone-600" />
              </button>

              <div className="bg-white rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
                <Quote className="absolute top-4 left-4 text-amber-100" size={50} />

                <div className="relative z-10 text-center">
                  <p className="text-lg md:text-xl text-stone-700 leading-relaxed mb-6 italic">
                    "{stories[currentSlide]?.quote}"
                  </p>
                  <div>
                    <p className="font-medium text-stone-800">{stories[currentSlide]?.name}</p>
                    <p className="text-stone-500 text-sm">
                      {stories[currentSlide]?.role} · {stories[currentSlide]?.year}
                    </p>
                  </div>
                </div>

                {/* 슬라이드 인디케이터 */}
                <div className="flex justify-center gap-2 mt-6">
                  {stories.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentSlide ? 'w-6 bg-amber-500' : 'w-1.5 bg-stone-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 오른쪽 화살표 - hover 시에만 표시, 무한 루프 */}
              <button
                onClick={() => setCurrentSlide(prev => (prev + 1) % stories.length)}
                className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white border border-stone-200 rounded-full shadow-md hover:shadow-lg hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={20} className="text-stone-600" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 주목받는 프로젝트 섹션 */}
      <section className="py-16 md:py-20 px-4 bg-stone-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-amber-600" />
                <p className="text-amber-600 uppercase tracking-[0.2em] text-xs">Now Trending</p>
              </div>
              <h2 className="text-xl md:text-2xl text-stone-800 font-light">
                지금 <span className="font-medium">주목받는</span> 프로젝트
              </h2>
            </div>
            <Link
              to="/projects?sortBy=mostFavorited"
              className="hidden md:flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors text-sm"
            >
              전체보기 <ArrowRight size={16} />
            </Link>
          </div>

          {popularLoading ? (
            <div className="bg-white rounded-xl border border-stone-200 py-12">
              <LoadingSpinner
                size="md"
                message="주목받는 프로젝트를 불러오는 중..."
              />
            </div>
          ) : popularProjects && popularProjects.length > 0 ? (
            <div className="relative group">
              {/* 왼쪽 화살표 - 스크롤 가능할 때만 표시 */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left', trendingScrollRef)}
                  className="hidden md:flex absolute -left-4 top-1/3 z-10 w-10 h-10 items-center justify-center bg-white border border-stone-200 rounded-full shadow-md hover:shadow-lg hover:bg-amber-50 transition-all"
                >
                  <ChevronLeft size={20} className="text-stone-600" />
                </button>
              )}

              <div
                ref={trendingScrollRef}
                className="overflow-x-auto scrollbar-hide scroll-smooth -mx-4 px-4 touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex gap-5" style={{ width: 'max-content' }}>
                  {popularProjects.map(project => {
                    const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                    return (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="w-[280px] flex-shrink-0 bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-amber-300 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
                          {project.image ? (
                            <img
                              src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.image}`}
                              alt={project.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <Heart size={48} />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-stone-800 text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                            D-{project.dday}
                          </div>
                        </div>

                        <div className="p-4">
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            {getCategoryLabel(project.category)}
                          </span>
                          <h3 className="font-medium text-stone-800 mt-2 mb-3 line-clamp-2 leading-snug">
                            {project.title}
                          </h3>

                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-amber-600 font-bold">{progress}%</span>
                            <span className="text-stone-500">{formatAmount(project.currentAmount)}원</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 오른쪽 화살표 - 스크롤 가능할 때만 표시 */}
              {canScrollRight && (
                <button
                  onClick={() => scroll('right', trendingScrollRef)}
                  className="hidden md:flex absolute -right-4 top-1/3 z-10 w-10 h-10 items-center justify-center bg-white border border-stone-200 rounded-full shadow-md hover:shadow-lg hover:bg-amber-50 transition-all"
                >
                  <ChevronRight size={20} className="text-stone-600" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">프로젝트가 없습니다.</div>
          )}

          <Link
            to="/projects?sortBy=mostFavorited"
            className="md:hidden flex items-center justify-center gap-2 text-stone-600 hover:text-amber-600 transition-colors mt-6 text-sm"
          >
            전체보기 <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 후원 TOP 프로젝트 섹션 - 1+2 그리드 레이아웃 */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-amber-600" />
                <p className="text-amber-600 uppercase tracking-[0.2em] text-xs">Top Funded</p>
              </div>
              <h2 className="text-xl md:text-2xl text-stone-800 font-light">
                후원 <span className="font-medium">TOP</span> 프로젝트
              </h2>
            </div>
            <Link
              to="/projects?sortBy=mostDonated"
              className="hidden md:flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors text-sm"
            >
              전체보기 <ArrowRight size={16} />
            </Link>
          </div>

          {topFundedLoading ? (
            <div className="bg-stone-50 rounded-xl border border-stone-200 py-12">
              <LoadingSpinner
                size="md"
                message="후원 TOP 프로젝트를 불러오는 중..."
              />
            </div>
          ) : topFundedProjects && topFundedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1위 프로젝트 - 메인 카드 */}
              {topFundedProjects[0] && (
                <Link
                  to={`/projects/${topFundedProjects[0].id}`}
                  className="row-span-2 bg-stone-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group border border-stone-200"
                >
                  <div className="h-56 bg-stone-100 relative overflow-hidden">
                    {topFundedProjects[0].image ? (
                      <img
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL}${topFundedProjects[0].image}`}
                        alt={topFundedProjects[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Heart
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-300 group-hover:scale-110 transition-transform duration-500"
                        size={100}
                      />
                    )}
                    {/* 1위 배지 */}
                    <div className="absolute top-0 left-0 bg-amber-500 text-white px-4 py-2 font-bold text-lg rounded-br-xl">
                      1위
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
                        {getCategoryLabel(topFundedProjects[0].category)}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-stone-800 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {topFundedProjects[0].title}
                    </h3>

                    {/* 프로그레스 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-amber-600 font-bold text-lg">
                          {calculatePercentage(topFundedProjects[0].currentAmount, topFundedProjects[0].targetAmount)}%
                        </span>
                        <span className="text-stone-400">D-{topFundedProjects[0].dday}</span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${Math.min(calculatePercentage(topFundedProjects[0].currentAmount, topFundedProjects[0].targetAmount), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>{formatAmount(topFundedProjects[0].currentAmount)}원 달성</span>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{topFundedProjects[0].donors}명 참여</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 2위, 3위 프로젝트 - 서브 카드 */}
              {topFundedProjects.slice(1, 3).map((project, idx) => {
                const progress = calculatePercentage(project.currentAmount, project.targetAmount);
                const rankColors = ['bg-stone-400', 'bg-amber-700'];
                const rankColor = rankColors[idx] || 'bg-stone-300';

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="bg-stone-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group border border-stone-200"
                  >
                    <div className="h-32 bg-stone-100 relative overflow-hidden">
                      {project.image ? (
                        <img
                          src={`${import.meta.env.VITE_IMAGE_BASE_URL}${project.image}`}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Heart
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-300 group-hover:scale-110 transition-transform"
                          size={40}
                        />
                      )}
                      {/* 순위 배지 */}
                      <div className={`absolute top-0 left-0 ${rankColor} text-white px-3 py-1.5 font-bold text-sm rounded-br-xl`}>
                        {idx + 2}위
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-amber-600 font-medium">{getCategoryLabel(project.category)}</span>
                      <h3 className="text-base font-medium text-stone-800 mt-1 mb-2 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600 font-bold">{progress}%</span>
                        <div className="flex items-center gap-1 text-stone-400 text-xs">
                          <Users size={12} />
                          <span>{project.donors}명</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">프로젝트가 없습니다.</div>
          )}

          <Link
            to="/projects?sortBy=mostDonated"
            className="md:hidden flex items-center justify-center gap-2 text-stone-600 hover:text-amber-600 transition-colors mt-6 text-sm"
          >
            전체보기 <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="py-8 sm:py-10 px-4 bg-amber-500 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl text-stone-900 font-light mb-3">
            오늘, <span className="font-medium">당신의 이야기</span>를 시작하세요
          </h2>
          <p className="text-stone-700 mb-5">
            작은 나눔이 모여 큰 변화를 만듭니다
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {isLoggedIn && userType === 'organization' ? (
              <Link
                to="/projects/create"
                className="bg-stone-900 text-white px-8 py-4 font-medium hover:bg-stone-800 transition-colors"
              >
                프로젝트 등록하기
              </Link>
            ) : (
              <Link
                to="/projects"
                className="bg-stone-900 text-white px-8 py-4 font-medium hover:bg-stone-800 transition-colors"
              >
                함께하기
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
