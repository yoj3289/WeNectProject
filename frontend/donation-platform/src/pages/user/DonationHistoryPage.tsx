import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, DollarSign, CheckCircle, AlertCircle, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { getMyDonations } from '../../api/donations';

interface DonationHistory {
  id: number;
  projectTitle: string;
  amount: number;
  date: string;
  receiptNumber: string;
  status: 'completed' | 'pending';
  donorName: string;
  organization: string;
}

interface DonationHistoryPageProps {
  onBack: () => void;
}

const DonationHistoryPage: React.FC<DonationHistoryPageProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([]);
  const pageSize = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // 연도 옵션 생성 (현재 연도부터 5년 전까지)
  const currentYear = new Date().getFullYear();
  const yearOptions = ['all', ...Array.from({ length: 5 }, (_, i) => String(currentYear - i))];

  // API 호출
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const response = await getMyDonations({
        year: selectedYear === 'all' ? undefined : selectedYear,
        status: filterStatus === 'all' ? undefined : filterStatus,
        page: currentPage - 1, // 백엔드는 0부터 시작
        size: pageSize,
      });

      // API 응답을 DonationHistory 형식으로 변환
      const mappedData: DonationHistory[] = response.content.map((item: any) => ({
        id: item.donationId || item.id,
        projectTitle: item.projectTitle || '프로젝트명 없음',
        amount: item.amount,
        date: item.createdAt ? item.createdAt.split('T')[0] : item.date || '',
        receiptNumber: item.receiptNumber || `RCP-${item.donationId || item.id}`,
        status: item.status?.toLowerCase() === 'completed' ? 'completed' : 'pending',
        donorName: item.donorName || '기부자',
        organization: item.organizationName || item.organization || '기관명 없음',
      }));

      setDonationHistory(mappedData);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || mappedData.length);
    } catch (error: any) {
      console.error('기부 내역 조회 실패:', error);
      toast.error('기부 내역을 불러오는데 실패했습니다.');
      setDonationHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, filterStatus]);

  // 페이지 또는 필터 변경 시 데이터 새로 불러오기
  useEffect(() => {
    fetchDonations();
  }, [currentPage, selectedYear, filterStatus]);

  // 검색어로 클라이언트 필터링 (프론트엔드 필터링)
  const filteredHistory = searchTerm.trim()
    ? donationHistory.filter(item =>
        item.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organization.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : donationHistory;

  // 통계 계산 (현재 페이지 기준)
  const totalDonations = totalElements;
  const totalAmount = filteredHistory.reduce((sum, item) => sum + item.amount, 0);
  const completedCount = filteredHistory.filter(item => item.status === 'completed').length;

  // PDF 영수증 생성 (시뮬레이션)
  const generateReceiptPDF = (donation: DonationHistory) => {
    const receiptContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        기부금 영수증
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

영수증 번호: ${donation.receiptNumber}
발급일자: ${new Date().toLocaleDateString('ko-KR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          기부자 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

성명: ${donation.donorName}
기부일자: ${donation.date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          기부 내역
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

프로젝트: ${donation.projectTitle}
수혜기관: ${donation.organization}
기부금액: ${donation.amount.toLocaleString()}원

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          세액공제 안내
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

본 영수증은 연말정산 시 세액공제를
받으실 수 있습니다.

소득세법 제34조 및 법인세법 제24조에
따라 기부금 세액공제 대상입니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

발급기관: ${donation.organization}
문의전화: 02-1234-5678

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // Blob 생성 및 다운로드
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `기부금영수증_${donation.receiptNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('기부금 영수증이 다운로드되었습니다!');
  };

  // 전체 영수증 한번에 다운로드
  const downloadAllReceipts = () => {
    const completedDonations = filteredHistory.filter(d => d.status === 'completed');

    if (completedDonations.length === 0) {
      toast.error('다운로드 가능한 영수증이 없습니다.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '영수증 다운로드',
      message: `${completedDonations.length}개의 영수증을 다운로드하시겠습니까?`,
      onConfirm: () => {
        completedDonations.forEach((donation, index) => {
          setTimeout(() => {
            generateReceiptPDF(donation);
          }, index * 500);
        });
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <button
          onClick={onBack}
          className="mb-4 md:mb-6 text-gray-600 hover:text-gray-900 font-semibold text-sm md:text-base"
        >
          ← 돌아가기
        </button>

        {/* 헤더 */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">기부 내역</h1>
          <p className="text-sm md:text-base text-gray-600">나의 소중한 기부 활동을 확인하고 영수증을 받아보세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-red-600" size={32} />
            </div>
            <p className="text-sm text-gray-600 mb-1">현재 페이지 금액</p>
            <p className="text-3xl font-bold text-red-600">{totalAmount.toLocaleString()}원</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-blue-600" size={32} />
            </div>
            <p className="text-sm text-gray-600 mb-1">총 기부 횟수</p>
            <p className="text-3xl font-bold text-blue-600">{totalDonations}회</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <p className="text-sm text-gray-600 mb-1">현재 페이지 완료</p>
            <p className="text-3xl font-bold text-green-600">{completedCount}건</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="프로젝트명 또는 기관명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
              />
            </div>

            {/* 연도 필터 */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? '전체 연도' : `${year}년`}
                </option>
              ))}
            </select>

            {/* 상태 필터 */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending')}
              className="px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="all">전체</option>
              <option value="completed">완료</option>
              <option value="pending">대기중</option>
            </select>

            {/* 전체 다운로드 */}
            <button
              onClick={downloadAllReceipts}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm md:text-base"
            >
              <Download size={18} />
              <span className="hidden sm:inline">전체 다운로드</span>
              <span className="sm:hidden">다운로드</span>
            </button>
          </div>
        </div>

        {/* 기부 내역 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-red-500" size={48} />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-lg font-semibold text-gray-600 mb-2">기부 내역이 없습니다</p>
              <p className="text-sm text-gray-500">검색 조건을 변경해보세요</p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">날짜</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">기관</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">금액</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">영수증 번호</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">상태</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">영수증</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredHistory.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{donation.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{donation.projectTitle}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{donation.organization}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-lg text-red-600">
                            {donation.amount.toLocaleString()}원
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-sm font-mono text-gray-600">{donation.receiptNumber}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {donation.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              <CheckCircle size={14} />
                              완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                              <AlertCircle size={14} />
                              대기중
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {donation.status === 'completed' ? (
                            <button
                              onClick={() => generateReceiptPDF(donation)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                            >
                              <Download size={16} />
                              다운로드
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">처리 중</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredHistory.map((donation) => (
                  <div key={donation.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-1">{donation.projectTitle}</p>
                        <p className="text-sm text-gray-600">{donation.organization}</p>
                      </div>
                      {donation.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle size={12} />
                          완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          <AlertCircle size={12} />
                          대기중
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Calendar size={14} />
                      <span>{donation.date}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">기부 금액</p>
                        <p className="text-xl font-bold text-red-600">{donation.amount.toLocaleString()}원</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">영수증 번호</p>
                        <p className="text-xs font-mono text-gray-600">{donation.receiptNumber}</p>
                      </div>
                    </div>
                    {donation.status === 'completed' && (
                      <button
                        onClick={() => generateReceiptPDF(donation)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                        <Download size={16} />
                        영수증 다운로드
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* 안내 사항 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <FileText size={20} />
            영수증 안내
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 기부금 영수증은 기부 완료 후 즉시 발급됩니다.</li>
            <li>• 연말정산 시 소득공제 또는 세액공제를 받으실 수 있습니다.</li>
            <li>• 영수증은 5년간 보관하시기 바랍니다.</li>
            <li>• 영수증 재발급이 필요하신 경우 고객센터(02-1234-5678)로 문의해주세요.</li>
          </ul>
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default DonationHistoryPage;
