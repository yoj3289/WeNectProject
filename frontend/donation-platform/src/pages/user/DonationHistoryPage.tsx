import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, Calendar, DollarSign, CheckCircle, AlertCircle, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { getMyDonations, getMyDonationStats, type DonationStatsResponse } from '../../api/donations';

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
  const [stats, setStats] = useState<DonationStatsResponse | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfDonation, setPdfDonation] = useState<DonationHistory | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
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

  // 통계 API 호출 (최초 1회)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getMyDonationStats();
        setStats(response);
      } catch (error) {
        console.error('기부 통계 조회 실패:', error);
      }
    };
    fetchStats();
  }, []);

  // 기부 내역 API 호출
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

  // PDF 영수증 생성 (jsPDF + html2canvas)
  const generateReceiptPDF = async (donation: DonationHistory) => {
    setIsGeneratingPDF(true);
    setPdfDonation(donation);

    // DOM 렌더링을 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (!receiptRef.current) {
        throw new Error('영수증 템플릿을 찾을 수 없습니다.');
      }

      // html2canvas로 HTML을 캔버스로 변환
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // 고해상도
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // jsPDF로 PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190; // A4 너비에서 여백 제외
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const xOffset = (210 - imgWidth) / 2; // 중앙 정렬
      const yOffset = 10;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

      // PDF 다운로드
      pdf.save(`기부금영수증_${donation.receiptNumber}.pdf`);
      toast.success('영수증이 다운로드되었습니다.');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      toast.error('영수증 다운로드에 실패했습니다.');
    } finally {
      setIsGeneratingPDF(false);
      setPdfDonation(null);
    }
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
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        for (const donation of completedDonations) {
          await generateReceiptPDF(donation);
          // 각 PDF 생성 사이에 딜레이
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        toast.success(`${completedDonations.length}개의 영수증 다운로드 완료`);
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
            <p className="text-sm text-gray-600 mb-1">총 기부금액</p>
            <p className="text-3xl font-bold text-red-600">
              {stats ? Number(stats.totalAmount).toLocaleString() : '0'}원
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-blue-600" size={32} />
            </div>
            <p className="text-sm text-gray-600 mb-1">총 기부 횟수</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalCount || 0}회</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <p className="text-sm text-gray-600 mb-1">영수증 발급 가능</p>
            <p className="text-3xl font-bold text-green-600">{stats?.completedCount || 0}건</p>
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

      {/* PDF 생성용 숨겨진 영수증 템플릿 */}
      {pdfDonation && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div
            ref={receiptRef}
            style={{
              width: '600px',
              padding: '40px',
              backgroundColor: '#fff',
              fontFamily: "'Malgun Gothic', 'Noto Sans KR', sans-serif",
            }}
          >
            {/* 영수증 내용 */}
            <div style={{ border: '2px solid #333', padding: '30px' }}>
              {/* 헤더 */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: 'bold' }}>기부금 영수증</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>DONATION RECEIPT</p>
              </div>

              {/* 영수증 정보 */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', background: '#f5f5f5', padding: '8px 12px', marginBottom: '15px', borderLeft: '4px solid #e53e3e' }}>
                  영수증 정보
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ color: '#666' }}>영수증 번호</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.receiptNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <span style={{ color: '#666' }}>발급일자</span>
                  <span style={{ fontWeight: 'bold' }}>{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              {/* 기부자 정보 */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', background: '#f5f5f5', padding: '8px 12px', marginBottom: '15px', borderLeft: '4px solid #e53e3e' }}>
                  기부자 정보
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ color: '#666' }}>성명</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.donorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <span style={{ color: '#666' }}>기부일자</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.date}</span>
                </div>
              </div>

              {/* 기부 내역 */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', background: '#f5f5f5', padding: '8px 12px', marginBottom: '15px', borderLeft: '4px solid #e53e3e' }}>
                  기부 내역
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ color: '#666' }}>프로젝트</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.projectTitle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <span style={{ color: '#666' }}>수혜기관</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.organization}</span>
                </div>
                <div style={{ fontSize: '24px', color: '#e53e3e', textAlign: 'center', padding: '20px', background: '#fff5f5', borderRadius: '8px', margin: '15px 0', fontWeight: 'bold' }}>
                  기부금액: {pdfDonation.amount.toLocaleString()}원
                </div>
              </div>

              {/* 세액공제 안내 */}
              <div style={{ background: '#e8f4fd', padding: '15px', borderRadius: '8px', fontSize: '13px', color: '#1a5276', lineHeight: '1.6' }}>
                <strong>세액공제 안내</strong><br /><br />
                본 영수증은 연말정산 시 세액공제를 받으실 수 있습니다.<br />
                소득세법 제34조 및 법인세법 제24조에 따라 기부금 세액공제 대상입니다.<br />
                영수증은 5년간 보관하시기 바랍니다.
              </div>

              {/* 푸터 */}
              <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd', color: '#666', fontSize: '12px' }}>
                발급기관: {pdfDonation.organization}<br />
                문의전화: 02-1234-5678<br /><br />
                <strong>위넥트(WeNect) 기부 플랫폼</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF 생성 중 로딩 오버레이 */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-red-500" size={48} />
            <p className="text-lg font-semibold text-gray-700">영수증 PDF 생성 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistoryPage;
