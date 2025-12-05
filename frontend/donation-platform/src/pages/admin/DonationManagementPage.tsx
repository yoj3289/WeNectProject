import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Eye, Star, StarOff, RefreshCw, ChevronLeft, ChevronRight, Calendar, X, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminDonations, useToggleFeatured } from '../../hooks/useDonations';
import type { AdminDonationFilters } from '../../api/donations';

const PAGE_SIZE = 20;

// 탭 타입
type TabType = 'donations' | 'messages';

// 상태 필터 옵션
const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'completed', label: '완료' },
  { value: 'pending', label: '대기중' },
  { value: 'cancelled', label: '취소' },
  { value: 'failed', label: '실패' },
];

// 기간 필터 옵션
const PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: 'week', label: '최근 1주일' },
  { value: 'month', label: '최근 1개월' },
  { value: '3months', label: '최근 3개월' },
];

// Featured 필터 옵션 (응원 메시지 탭용)
const FEATURED_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'true', label: '노출중' },
  { value: 'false', label: '미노출' },
];

const DonationManagementPage: React.FC = () => {
  // 현재 탭
  const [activeTab, setActiveTab] = useState<TabType>('donations');

  // 필터 상태
  const [filters, setFilters] = useState<AdminDonationFilters>({
    status: '',
    period: 'all',
    page: 0,
    size: PAGE_SIZE,
  });
  const [isFeaturedFilter, setIsFeaturedFilter] = useState<string>('');

  // 상세 모달
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // API 훅 - 탭에 따라 다른 필터 적용
  const { data, isLoading, refetch } = useAdminDonations({
    ...filters,
    // 응원 메시지 탭에서는 메시지 있는 것만, 기부 내역 탭에서는 전체
    hasMessage: activeTab === 'messages' ? true : undefined,
    isFeatured: activeTab === 'messages' && isFeaturedFilter !== ''
      ? isFeaturedFilter === 'true'
      : undefined,
  });

  const toggleFeaturedMutation = useToggleFeatured();

  // 탭 변경 시 페이지 초기화
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 0 }));
    setIsFeaturedFilter('');
  }, [activeTab]);

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 금액 포맷
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 상태 뱃지 렌더링
  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      COMPLETED: '완료',
      PENDING: '대기중',
      CANCELLED: '취소',
      FAILED: '실패',
    };
    const upperStatus = status.toUpperCase();
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[upperStatus] || 'bg-gray-100 text-gray-700'}`}>
        {labels[upperStatus] || status}
      </span>
    );
  };

  // Featured 토글 핸들러
  const handleToggleFeatured = async (donationId: number, currentFeatured: boolean) => {
    try {
      await toggleFeaturedMutation.mutateAsync({
        donationId,
        isFeatured: !currentFeatured,
      });
      toast.success(currentFeatured ? '홈페이지 노출이 해제되었습니다.' : '홈페이지에 노출됩니다.');
      refetch();
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      status: '',
      period: 'all',
      page: 0,
      size: PAGE_SIZE,
    });
    setIsFeaturedFilter('');
  };

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 0 }));
  }, [filters.status, filters.period, isFeaturedFilter]);

  const donations = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const currentPage = filters.page || 0;

  // 페이지네이션 컴포넌트
  const Pagination = () => (
    totalPages > 1 ? (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter(page => {
              return Math.abs(page - currentPage) <= 2 || page === 0 || page === totalPages - 1;
            })
            .map((page, idx, arr) => (
              <React.Fragment key={page}>
                {idx > 0 && arr[idx - 1] !== page - 1 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-rose-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page + 1}
                </button>
              </React.Fragment>
            ))}
        </div>
        <button
          onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    ) : null
  );

  return (
    <>
      {/* 상세 모달 */}
      {showDetailModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">기부 상세</h2>
                <p className="text-sm text-gray-600 mt-1">기부 정보를 확인합니다</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedDonation(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200">
                <div className="flex items-center justify-between mb-4">
                  {renderStatusBadge(selectedDonation.status)}
                  {selectedDonation.isFeatured && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      홈페이지 노출중
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800">{selectedDonation.projectTitle}</h3>
                <div className="bg-white rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">기부금액</span>
                    <span className="text-2xl font-bold text-rose-600">{formatAmount(selectedDonation.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">기부일</span>
                    <span className="font-semibold text-gray-800">{formatDate(selectedDonation.donatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* 기부자 정보 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-rose-500" />
                  기부자 정보
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">기부자</span>
                    <span className="font-semibold text-gray-800">
                      {selectedDonation.isAnonymous ? '익명' : selectedDonation.donorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">익명 여부</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedDonation.isAnonymous ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                      {selectedDonation.isAnonymous ? '익명' : '공개'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 응원 메시지 */}
              {selectedDonation.message && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500" />
                    응원 메시지
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedDonation.message}</p>
                  </div>
                </div>
              )}

              {/* Featured 토글 (메시지 있는 경우만) */}
              {selectedDonation.message && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <Star size={20} className="text-amber-600" />
                    홈페이지 노출 설정
                  </h4>
                  <p className="text-sm text-amber-700 mb-4">
                    이 응원 메시지를 홈페이지 후기 섹션에 노출할 수 있습니다.
                  </p>
                  <button
                    onClick={() => handleToggleFeatured(selectedDonation.donationId, selectedDonation.isFeatured)}
                    disabled={toggleFeaturedMutation.isPending}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      selectedDonation.isFeatured
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    } disabled:opacity-50`}
                  >
                    {selectedDonation.isFeatured ? '노출 해제하기' : '홈페이지에 노출하기'}
                  </button>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedDonation(null); }}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">기부 관리</h1>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === 'donations'
                ? '전체 기부 내역을 조회합니다'
                : '응원 메시지를 확인하고 홈페이지 노출을 관리합니다'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('donations')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
              activeTab === 'donations'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CreditCard size={18} />
            기부 내역
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
              activeTab === 'messages'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare size={18} />
            응원 메시지
          </button>
        </div>

        {/* 기부 내역 탭 */}
        {activeTab === 'donations' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* 필터 */}
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  <select
                    value={filters.period}
                    onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  >
                    {PERIOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                >
                  필터 초기화
                </button>
              </div>
            </div>

            {/* 테이블 */}
            {isLoading ? (
              <div className="p-12 text-center">
                <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">기부 내역을 불러오는 중...</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="p-12 text-center">
                <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">조건에 맞는 기부 내역이 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 데스크톱 테이블 뷰 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기부일</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기부자</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">금액</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">상태</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {donations.map((donation: any) => (
                        <tr key={donation.donationId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="text-gray-600 text-sm whitespace-nowrap">
                              {formatDate(donation.donatedAt || donation.approvedAt || donation.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800 line-clamp-1 max-w-[200px]">
                              {donation.projectTitle}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-700 text-sm">
                              {donation.isAnonymous ? '익명' : donation.donorName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-800 font-bold whitespace-nowrap">
                              {formatAmount(donation.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {renderStatusBadge(donation.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setSelectedDonation(donation);
                                  setShowDetailModal(true);
                                }}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                title="상세보기"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일 카드 뷰 */}
                <div className="md:hidden divide-y divide-gray-200">
                  {donations.map((donation: any) => (
                    <div key={donation.donationId} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{donation.projectTitle}</p>
                          <p className="text-lg font-bold text-rose-600 mt-1">{formatAmount(donation.amount)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {renderStatusBadge(donation.status)}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {donation.isAnonymous ? '익명' : donation.donorName} · {formatDate(donation.donatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDonation(donation);
                            setShowDetailModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex-shrink-0"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 푸터 - 페이지네이션 */}
            <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                총 <strong>{totalElements}</strong>건
                {donations.length > 0 && (
                  <span className="hidden md:inline ml-2">
                    ({currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)}건 표시)
                  </span>
                )}
              </p>
              <Pagination />
            </div>
          </div>
        )}

        {/* 응원 메시지 탭 */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* 필터 */}
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  <select
                    value={filters.period}
                    onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  >
                    {PERIOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Star size={18} className="text-gray-400" />
                  <select
                    value={isFeaturedFilter}
                    onChange={(e) => setIsFeaturedFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  >
                    {FEATURED_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                >
                  필터 초기화
                </button>
              </div>
            </div>

            {/* 메시지 리스트 */}
            {isLoading ? (
              <div className="p-12 text-center">
                <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">응원 메시지를 불러오는 중...</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">조건에 맞는 응원 메시지가 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {donations.map((donation: any) => (
                  <div key={donation.donationId} className="p-4 md:p-6 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* 메시지 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold text-gray-800">
                            {donation.isAnonymous ? '익명' : donation.donorName}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(donation.donatedAt)}
                          </span>
                          {donation.isFeatured && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold flex items-center gap-1">
                              <Star size={10} fill="currentColor" />
                              노출중
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          프로젝트: {donation.projectTitle}
                        </p>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{donation.message}</p>
                        </div>
                        <p className="text-sm text-rose-600 font-semibold mt-2">
                          {formatAmount(donation.amount)} 기부
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex md:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedDonation(donation);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          상세
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(donation.donationId, donation.isFeatured)}
                          disabled={toggleFeaturedMutation.isPending}
                          className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                            donation.isFeatured
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {donation.isFeatured ? (
                            <>
                              <StarOff size={16} />
                              노출 해제
                            </>
                          ) : (
                            <>
                              <Star size={16} />
                              노출하기
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 푸터 - 페이지네이션 */}
            <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                총 <strong>{totalElements}</strong>건의 응원 메시지
                {donations.length > 0 && (
                  <span className="hidden md:inline ml-2">
                    ({currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)}건 표시)
                  </span>
                )}
              </p>
              <Pagination />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DonationManagementPage;
